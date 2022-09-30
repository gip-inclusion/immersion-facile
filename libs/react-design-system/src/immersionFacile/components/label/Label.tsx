import React from "react";

export type LabelProperties = {
  label?: string;
  htmlFor?: string;
};
export const Label = ({ label, htmlFor }: LabelProperties) => (
  <label className="fr-label" htmlFor={htmlFor}>
    {label}
  </label>
);
