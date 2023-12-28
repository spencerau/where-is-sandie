#!/bin/bash

# Get list of open terminal processes
processes=$(osascript -e 'tell application "System Events" to get the name of every process whose visible is true')

# Loop through processes and close terminals
for process in $processes; do
  if [[ $process == Terminal ]]; then
    osascript -e 'tell application "Terminal" to quit'
  fi
done

clear

# Open terminal window for FindMyHistory and run main.py
osascript -e 'tell application "Terminal" to do script "cd /Users/spencerau/FindMyHistory && python3 main.py"'

# Adding a short sleep to ensure main.py has started
#sleep 3

# Navigate to the where-is-sandy directory and run doggo.py
#osascript -e 'tell application "Terminal" to do script "cd /Users/spencerau/Documents/GitHub/where-is-sandy && python3 doggo.py"'

#osascript -e 'tell application "Terminal" to do script "cd /Users/spencerau/Documents/GitHub/where-is-sandy && node server.js"'
