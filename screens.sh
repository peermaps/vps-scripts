#!/bin/bash
# sets up screens for seeding ipfs and hyperdrive

if test $(screen -list | grep -E '^\s[0-9]+\.ipfs\b' | wc -l) -eq 0; then
  screen -dmS ipfs
  screen -x ipfs -X stuff 'ipfs daemon\n'
fi

if test $(screen -list | grep -E '^\s[0-9]+\.hyperdrive\b' | wc -l) -eq 0; then
  screen -dmS hyperdrive
  screen -x hyperdrive -X stuff 'hyperdrive-cmd share ~/data/peermaps/peermaps.hyperdrive\n'
fi
