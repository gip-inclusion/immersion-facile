import React from "react";

export type ButtonDeleteProps = {
  isHidden?: boolean;
  disabled?: boolean;
  classname?: string;
  style?: { [key: string]: string };
  onClick: () => void;
};

export const ButtonDelete = ({
  isHidden = false,
  disabled = false,
  classname = "",
  style = {},
  onClick,
}: ButtonDeleteProps) => (
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
