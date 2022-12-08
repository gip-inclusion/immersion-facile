import React from "react";
import { IconValue } from "./types";

type IconProps = {
  kind: IconValue;
  className?: string;
};

export const Icon = ({ kind, className }: IconProps) => (
  <i className={`fr-icon-${kind} ${className ?? ""}`} aria-hidden="true"></i>
);
