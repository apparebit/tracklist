# @grr/tracklist

Print all tracks in the library of the Music.app in macOS.

This command line tool sorts tracks by artist, album, and track name without
regard for case or diacritics and then prints a line with the artist, album, and
track name for each track.


## How to Install & Run

To use `@grr/tracklist`, you need to first install the tool and supporting code.
Since we are installing into a newly created directory, `npm` complains about a
lack of manifest and lockfile. You can ignore that.

```sh
mkdir inventory
cd inventory
npm install @grr/tracklist
```

Once installed, you can run `@grr/tracklist` in two different ways corresponding
to two very different ways of accessing the track data. First is access to track
data by scripting the Music.app itself. Luckily, we don't have to fall back onto
AppleScript but can use JavaScript instead:

```sh
osascript -l JavaScript ./node_modules/@grr/tracklist/tracklist.js
```

Second is access to track data through an XML property list that captures a
library's metadata. In this case, we parse the property list with
[expat](https://libexpat.github.io), a streaming XML parser. As the code in
[parse.js](parse.js) illustrates, correctly handling callbacks can get rather
involved. At the same time, it enables us to ignore irrelevant data in the
library's property list and thereby avoid building the corresponding object
graph only to discard it again.

```sh
node ./node_modules/@grr/tracklist/tracklist.js <Library.xml>
```

The JXA and XML versions co-exist in the same module, since both versions sort
and print a tracklist the same. For that to be possible, the XML version does
not use static imports and uses the dynamic `import()` form only indirectly,
i.e., by dynamically creating a function that imports a module. Otherwise,
`osascript` would reject the module.


## Background

I wrote `@grr/tracklist` when I encountered problems migrating my music library
onto a new Mac. Since I store the actual tracks on a networked drive, I was
trying to simply import the `Library.xml` I had previously exported on the old
machine. That worked for the most part. Though Music.app notified me that it
couldn't import some tracks. Since my library contains well over 27,000 tracks,
that error message was exceedingly unhelpful. Clearly, I needed some tool to
compare the two libraries. The data in such an exported `Library.xml` file is in
Apple's generic property list format. That makes it unsuitable to textual
comparison (`diff`). In theory, Apple's property list tool `plutil` can convert
XMl-based property lists to JSON. But in practice, the tool refuses to convert
Music.app libraries because JSON lacks support for dates. Hence I wrote my own
tool.

Once I started `diff`-ing the output produced with `@grr/tracklist`, the reason
for Music.app dropping tracks became apparent: The metadata for all dropped
tracks differed from other tracks by the same artist or on the same album only
in capitalization. That can be problematic when deriving file names from
metadata, as Music.app does, since macOS defaults to case-preserving file
systems while my networked disk, which runs Linux, has a case-sensitive file
system. It actually speaks to the software quality of iTunes that this hasn't
caused any issues before. Since library import doesn't handle this correctly, I
fixed the metadata and file names to have the same consistent casing on my old
machine. I did the same normalization for quotes and diacritics. Thereafter, I
reset Music.app to a blank slate (by starting the application with the option
key pressed and selecting a fresh library directory) and imported the library
without a hitch.

---

__@grr/tracklist__ is © 2020 Robert Grimm and licensed under [MIT](LICENSE)
terms.
