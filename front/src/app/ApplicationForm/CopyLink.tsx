import React, { useState } from "react";
import { IconButton, Tooltip } from "@mui/material";
import ShareIcon from "@mui/icons-material/Share";

const iconColor = "#3458a2";

export const CopyLink = () => {
  const [tooltipText, setTooltipText] = useState<string>(
    "Copier le lien pour partager le formulaire",
  );
  return (
    <Tooltip title={tooltipText}>
      <IconButton
        onClick={() => {
          navigator.clipboard.writeText(window.location.href);
          setTooltipText("Lien copié !");
        }}
      >
        <ShareIcon sx={{ color: iconColor }} />
      </IconButton>
    </Tooltip>
  );
};
