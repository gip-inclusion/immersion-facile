import React, { useState } from "react";
import ShareIcon from "@mui/icons-material/Share";
import { IconButton, Tooltip } from "@mui/material";

type FormSectionTitleProps = { children: string };

export const FormSectionTitle = ({ children }: FormSectionTitleProps) => {
  const [tooltipText, setTooltipText] = useState<string>(
    "Copier le lien pour partager le formulaire",
  );
  return (
    <>
      <div className="h-6" />
      <div
        className={
          "sticky top-0 text-immersionBlue-dark font-semibold p-2 mb-1 bg-white border-b text-lg z-10 flex justify-between"
        }
      >
        <div>{children}</div>
        <Tooltip title={tooltipText}>
          <IconButton
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              setTooltipText("Lien copié !");
            }}
          >
            <ShareIcon sx={{ color: "#3458a2" }} />
          </IconButton>
        </Tooltip>
      </div>
    </>
  );
};
