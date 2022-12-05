import React from "react";
import { IconValue } from "./types";

type IconProps = {
  type: IconValue;
  className?: string;
};

export const Icon = ({ type, className }: IconProps) => (
  <i className={`fr-icon-${type} ${className ?? ""}`} aria-hidden="true"></i>
);
