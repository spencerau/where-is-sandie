#!/bin/bash

processes=$(osascript -e 'tell application "System Events" to get the name of every process whose visible is true')

for process in $processes; do
  if [[ $process == Terminal ]]; then
    osascript -e 'tell application "Terminal" to quit'
  fi
done

clear

rm -rf /Users/spencerau/Documents/GitHub/where-is-sandie/FindMyHistory/log/*

# Open terminal window for FindMyHistory and run main.py
osascript -e 'tell application "Terminal" to do script "cd /Users/spencerau/Documents/GitHub/where-is-sandie/FindMyHistory && python3 main.py"'

# Open terminal window to run upload_csv.py
osascript -e 'tell application "Terminal" to do script "cd /Users/spencerau/Documents/GitHub/where-is-sandie && python3 upload_csv.py"'