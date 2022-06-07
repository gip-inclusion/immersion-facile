import React from "react";

export type FieldDescriptionProperties = {
  description?: string;
};

export const FieldDescription = ({
  description = "**Require description**",
}: FieldDescriptionProperties): JSX.Element => (
  <span className="fr-hint-text" id="select-hint-desc-hint">
    {description}
  </span>
);
