// (C) 2020 Robert Grimm

// Running This Script With and Without Module System
// --------------------------------------------------
//
// The JXA runtime does not support CommonJS or ESM modules. Yet the code for
// accessing tracks via JXA as well as the code for sorting and printing tracks
// is fairly short and straight-forward. Consequently, it makes sense to place
// all of it into the same module, i.e., this one.
//
// However, the parser for accessing tracks via XML property list is fairly
// substantial and also depends on a third-party package, i.e., the expat XML
// parsing engine, which is written in C. In other words, the code for accessing
// tracks via XML property list must utilize CommonJS or ESM and also requires
// the ability to load native code (or WASM). But it too needs to sort and print
// tracks, thus raising the question of how to support both from within the same
// module.
//
// With CommonJS, that might just reduce to calling `require()` from within
// `tracksViaXml()`. With ESM, similarly just calling `import()` does not work.
// The mere presence of that special form changes the JavaScript parsing goal
// from script to module, triggering an error in JXA. To still leverage the
// declarative features of ESM, notably in `parse.js`, this module uses a nice
// little hack: The call to the `import()` special form is only present as text,
// which is turned into executable code on demand, at runtime. As it turns out,
// the function constructor and `eval()` do have legitimate uses!

const isObject = (value) => typeof value === 'object';
const isFunction = (value) => typeof value === 'function';
const { values: valuesOf } = Object;

// -----------------------------------------------------------------------------
// Accessing Tracks via JXA

const isJxa = () => {
  try {
    return (
      isFunction($) &&
      isObject(ObjC) &&
      isFunction(ObjC.import) &&
      isFunction(Application) &&
      isFunction(Application.currentApplication)
    );
  } catch {
    return false;
  }
};

const tracksViaJxa = () => {
  const Music = Application('Music');
  if (!Music.running()) Music.run();
  const playlists = Music.playlists().filter(
    (p) => p.specialKind() === 'Library'
  );
  if (playlists.length !== 1) {
    throw new Error(`Music.app has ${playlists.length} libraries`);
  }
  return playlists[0].tracks().map((track) => ({
    artist: track.albumArtist() || track.artist() || 'Unknown',
    album: track.album() || 'Unknown',
    name: track.name() || 'Unknown',
  }));
};

// -----------------------------------------------------------------------------
// Accessing Tracks via XML Property List

const tracksViaXml = async () => {
  const load = new Function('spec', 'return import(spec);');
  const { readFile } = await load('fs/promises');
  const { default: parse } = await load('./parse.js');

  let bytes;
  try {
    bytes = await readFile(process.argv[2]);
  } catch (x) {
    console.log(`Could not read Music.app library (${x.message})!`);
    console.log(
      `Please provide filename for library as command line argument.`
    );
    return [];
  }

  const library = parse(bytes);
  return valuesOf(library.Tracks).map((track) => ({
    artist: track['Album Artist'] || track.Artist || 'Unknown',
    album: track.Album || 'Unknown',
    name: track.Name,
  }));
};

// -----------------------------------------------------------------------------
// Sorting and Printing

const collator = new Intl.Collator({
  sensitivity: 'base',
  ignorePunctuation: true,
});

const sortTracks = (tracks) =>
  tracks.sort((t1, t2) => {
    let result = collator.compare(t1.artist, t2.artist);
    if (result !== 0) return result;

    result = collator.compare(t1.album, t2.album);
    if (result !== 0) return result;

    return collator.compare(t1.name, t2.name);
  });

const formatTrack = (track) =>
  `${track.artist} ▻ ${track.album} ▻ ${track.name}`;
const printTracks = (tracks) =>
  tracks.forEach((t) => console.log(formatTrack(t)));

// -----------------------------------------------------------------------------

const main = async () => {
  const tracks = isJxa() ? tracksViaJxa() : await tracksViaXml();
  sortTracks(tracks);
  printTracks(tracks);
};

void main();
