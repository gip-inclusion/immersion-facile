import React, { useState } from "react";
import { useFormContext } from "react-hook-form";
import ShareIcon from "@mui/icons-material/Share";
import { IconButton, Tooltip } from "@mui/material";
import { ConventionReadDto } from "shared";
import { useConventionTexts } from "src/app/contents/forms/convention/textSetup";

const iconColor = "#3458a2";

export const CopyLink = () => {
  const { getValues } = useFormContext<ConventionReadDto>();
  const t = useConventionTexts(getValues().internshipKind);
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
