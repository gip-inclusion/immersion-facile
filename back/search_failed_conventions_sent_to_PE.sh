#!/bin/bash

# this script should be deleted once we solved our failed sending conventions issues with PE

# this script parses the logs and extracts the convention ids of the lines having "notAxiosError" or "notAxiosErrorOrNoResponse"
# archivePage=1 : parse the logs from the latest Scalingo archive
# fromDate="Apr 9": stop once the logs reach "Apr 9"
# after executing this script, the convention ids are stored in the file specified in outputFilename variable

# After having generated the file outputFilename:
# 1. Execute an "INSERT INTO conventions_to_sync_with_pe" query
# Do not forget to add this clause at the end of the "INSERT INTO query":
# ON CONFLICT(id) DO UPDATE SET status = EXCLUDED.status;
# 2. Run on the container "pnpm back trigger-resync-old-conventions-to-pe"
# 3. Check the failed conventions sent in table saved_errors

archivePage=1
fromDate="Apr 11"
outputFilename="output.txt"
erroredFormattedConventionIds=()
logArchivesDirectory="./archives"
appRegion="osc-secnum-fr1"
appName="if-prod-back"

while true; do
  mkdir $logArchivesDirectory

  echo "## fetching archivePage $archivePage..."
  logArchives=$(scalingo --region $appRegion --app $appName logs-archives --page $archivePage)
  urls=$(echo "$logArchives" | grep -o 'Url:.*' | awk '{print $2}')

  echo "## downloading archives..."
  for url in $urls; do
    wget -P "$logArchivesDirectory" "$url"
    oldFileName=$(basename "$url")
    newFileName=$(echo $(basename "$url") | sed 's/\?.*//')
    mv "$logArchivesDirectory/$oldFileName" "$logArchivesDirectory/$newFileName"
  done

  echo "## searching for convention ids..."
  errors=$(zgrep "notAxiosError\|notAxiosErrorOrNoResponse" "$logArchivesDirectory"/*.gz)
  erroredConventionIds=$(echo "$errors" | grep -o 'originalId":"[^"]*' | awk -F'":"' '{print $2}' | sort -u)
  if [ -n "$erroredConventionIds" ]; then
    erroredFormattedConventionIds+=$(echo "$erroredConventionIds" | sed "s/.*/'&',/" | tr -d '\n')
  fi

  ((archivePage++))
  rm -r $logArchivesDirectory

  hasReachedDate=$(echo $logArchives | grep "$fromDate")
  if [ -n "$hasReachedDate" ]; then
    echo "## page $archivePage"
    echo "## $logArchives"
    break
  fi
done

echo $erroredFormattedConventionIds > $outputFilename
