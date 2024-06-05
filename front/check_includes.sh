#!/usr/bin/env bash

files=$(grep --include=\*.{ts,tsx} -rnw 'src' -e 'import .* from .*back/.*' -e 'import .* from .*shared/.*' -e 'import .* from .*react-design-system/.*' -e 'import .* from .*/libs/.*' | grep -v 'import .* from .*feedback.*')
if [[ $files ]]; then 
  echo -e "\033[0;31mFound includes of back or detailled shared code in front!\033[0m";
  echo $files;
  exit 1;
fi
