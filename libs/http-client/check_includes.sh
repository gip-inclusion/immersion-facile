#!/usr/bin/env bash

files=$(grep --include=\*.{ts,tsx} -rnw 'src' -e "import .* from .*back/.*" -e "import .* from .*front/.*" -e "from .*shared.*" -e "from .*http-client.*")
if [[ $files ]]; then 
  echo -e "\033[0;31mFound includes of front, back, shared or http-client code in http-client !\033[0m";
  echo $files;
  exit 1;
fi
