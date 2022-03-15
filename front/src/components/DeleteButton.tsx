import React from "react";

type DeleteButtonProps = {
  isHidden?: boolean;
  disabled?: boolean;
  classname?: string;
  style?: { [key: string]: string };
  onClick: () => void;
};

export const DeleteButton = ({
  isHidden = false,
  disabled = false,
  classname = "",
  style = {},
  onClick,
}: DeleteButtonProps) => (
  <button
    type="button"
    style={{
      color: "#E10600",
      backgroundColor: "transparent",
      ...style,
    }}
    className={`fr-fi-close-circle-line ${
      isHidden ? "hidden" : ""
    } ${classname}`}
    disabled={disabled}
    onClick={onClick}
  />
);
