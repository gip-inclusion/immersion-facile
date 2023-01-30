import React from "react";
import { fr } from "@codegouvfr/react-dsfr";

export type FieldDescriptionProperties = {
  description?: string;
};

export const FieldDescription = ({
  description = "**Require description**",
}: FieldDescriptionProperties): JSX.Element => (
  <span className={fr.cx("fr-hint-text")}>{description}</span>
);
