#!/bin/bash

rm -f ./test/actual.txt
rm -f ./test/expected.txt

# --------------------------------
# Determine expected track listing
# --------------------------------

read -r -d '' EXPECTED << END_OF_TRACKS
Beyoncé ▻ HOMECOMING: THE LIVE ALBUM ▻ Crazy In Love (Homecoming Live)
Björk ▻ Vulnicura ▻ Quicksand
Flame 1 ▻ Fog / Shrine ▻ Fog
Flame 1 ▻ Fog / Shrine ▻ Shrine
THE CARTERS ▻ EVERYTHING IS LOVE ▻ NICE
The Philip Glass Ensemble, Philip Glass, Michael Riesman & Robert Wilson ▻ Philip Glass: Einstein on the Beach (feat. Robert Wilson) ▻ Knee Play 4 (feat. Robert Wilson)
Unknown2 ▻ Unknown ▻ Róisín Murphy - Incapable [Bitter End]-zwtI8G_7ZrA
END_OF_TRACKS

printf -v EXPECTED "$EXPECTED\n"

# ------------------------------
# Determine actual track listing
# ------------------------------

ACTUAL=$(./tracklist ./test/Library.xml)
printf -v ACTUAL "$ACTUAL\n"

# ----------------------
# Compare track listings
# ----------------------

if [[ "$ACTUAL" != "$EXPECTED" ]]; then
  echo "ERROR: Actual tracks differ from expected tracks:"
  echo

  printf "%s" "$ACTUAL" > ./test/actual.txt
  printf "%s" "$EXPECTED" > ./test/expected.txt
  diff ./test/actual.txt ./test/expected.txt
  exit 1
fi

echo "@grr/tracklist appears to be working!"
