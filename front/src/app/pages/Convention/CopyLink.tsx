import ShareIcon from "@mui/icons-material/Share";
import { IconButton, Tooltip } from "@mui/material";
import React, { useState } from "react";
import { useConventionTextsFromFormikContext } from "src/app/pages/Convention/texts/textSetup";

const iconColor = "#3458a2";

export const CopyLink = () => {
  const t = useConventionTextsFromFormikContext();
  const [tooltipText, setTooltipText] = useState<string>(t.copyLinkTooltip);

  return (
    <Tooltip title={tooltipText}>
      <IconButton
        onClick={async () => {
          await navigator.clipboard.writeText(window.location.href);
          setTooltipText(t.linkCopied);
        }}
      >
        <ShareIcon sx={{ color: iconColor }} />
      </IconButton>
    </Tooltip>
  );
};
