import DeleteIcon from "@mui/icons-material/Delete";
import IconButton from "@mui/material/IconButton";
import React from "react";

export type ButtonDeleteProps = {
  disabled?: boolean;
  isHidden?: boolean;
  className?: string;
  onClick: () => void;
};

export const ButtonDelete = ({
  disabled = false,
  className = "",
  onClick,
  isHidden,
}: ButtonDeleteProps) => (
  <span className={`${isHidden ? "invisible" : ""} ${className}`}>
    <IconButton aria-label="delete" disabled={disabled} onClick={onClick}>
      <DeleteIcon sx={{ color: "#000091" }} />
    </IconButton>
  </span>
);
