import React from "react";
import { IconValue } from "./types";

type IconProps = {
  type: IconValue;
};

export const Icon = ({ type }: IconProps) => (
  <i className={`fr-icon fr-icon-${type}`} aria-hidden="true"></i>
);
