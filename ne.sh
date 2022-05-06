#!/bin/bash
# build the natural earth data
test -d ~/dev/natural-earth-ingest || (
  mkdir -p ~/dev
  cd ~/dev
  git clone https://github.com/peermaps/natural-earth-ingest.git
  cd ~/dev/natural-earth-ingest
  npm i
)
cd ~/dev/natural-earth-ingest
test -d ~/data/natural_earth_vector || (
  mkdir -p ~/data/natural_earth_vector
  cd ~/data
  wget http://naciscdn.org/naturalearth/packages/natural_earth_vector.zip
  unzip natural_earth_vector.zip -d ~/data/natural_earth_vector
)
PATH=$PWD/node_modules/.bin:$PATH time ./build.sh ~/data/natural_earth_vector ~/data/ne
