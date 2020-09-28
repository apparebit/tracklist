// (C) 2020 Robert Grimm

const { values: valuesOf } = Object;

const isObject = (value) => typeof value === 'object';
const isFunction = (value) => typeof value === 'function';
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

const tracksViaXml = async () => {
  const load = new Function('spec', 'return import(spec);');
  const { readFile } = await load('fs/promises');
  const { default: parse } = await load('./parse.js');

  let bytes;
  try {
    bytes = await readFile(process.argv[2]);
  } catch (x) {
    console.log(`Could not read Music.app library (${x.message})!`);
    console.log(`Please provide filename for library as argument.`);
    return [];
  }

  const library = parse(bytes);
  return valuesOf(library.Tracks).map((track) => ({
    artist: track['Album Artist'] || track.Artist || 'Unknown',
    album: track.Album || 'Unknown',
    name: track.Name,
  }));
};

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

const main = async () => {
  const tracks = isJxa() ? tracksViaJxa() : await tracksViaXml();
  sortTracks(tracks);
  printTracks(tracks);
};

void main();
