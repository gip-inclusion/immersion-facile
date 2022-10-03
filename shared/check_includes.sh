#!/usr/bin/env bash

files=$(grep --include=\*.{ts,tsx} -rnw 'src' -e "import .* from .*back/.*" -e "import .* from .*front/.*" -e "from .*shared.*")
if [[ $files ]]; then 
  echo -e "\033[0;31mFound includes of front or back code in shared!\033[0m";
  echo $files;
  exit 1;
fi
