import React from "react";

type DeleteButtonProps = {
  isHidden?: boolean;
  disabled?: boolean;
  onClick: () => void;
};

export const DeleteButton = ({
  isHidden = false,
  disabled = false,
  onClick,
}: DeleteButtonProps) => (
  <button
    type="button"
    style={{
      color: "#E10600",
      backgroundColor: "transparent",
    }}
    className={`fr-fi-close-circle-line ${isHidden ? "hidden" : ""}`}
    disabled={disabled}
    onClick={onClick}
  />
);
