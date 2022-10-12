#!/usr/bin/env bash

files=$(grep --include=\*.{ts,tsx} -rnw 'src' -e "import .* from .*back/.*" -e "import .* from .*front/.*" -e "from .*html-templates.*")
if [[ $files ]]; then 
  echo -e "\033[0;31mFound includes of front or back or html-templates code in html-templates!\033[0m";
  echo $files;
  exit 1;
fi
