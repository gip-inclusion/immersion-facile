import React from "react";

export type LabelProperties = {
  name: string;
  label?: string;
};
export const Label = ({ name, label }: LabelProperties) => (
  <label className="fr-label" htmlFor={name}>
    {label}
  </label>
);
