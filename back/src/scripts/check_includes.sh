#!/usr/bin/env bash

files=$(grep --include=\*.{ts,tsx} -rnw 'src' -e "import .* from .*front/.*"  -e "from .*shared/.*")
if [[ $files ]]; then 
  echo -e "\033[0;31mFound includes of front code in back!\033[0m";
  echo $files;
  exit 1;
fi
