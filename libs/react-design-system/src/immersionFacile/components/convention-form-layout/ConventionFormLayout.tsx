import React from "react";
import { fr } from "@codegouvfr/react-dsfr";
import { useStyles } from "tss-react/dsfr";
import Styles from "./ConventionFormLayout.styles";

export type ConventionFormLayoutProperties = {
  form: React.ReactNode;
  sidebar: React.ReactNode;
};

export const ConventionFormLayout = ({
  form,
  sidebar,
}: ConventionFormLayoutProperties) => {
  const { cx } = useStyles();
  return (
    <>
      <div
        className={cx(fr.cx("fr-col-12", "fr-col-lg-8"), Styles.formWrapper)}
      >
        {form}
      </div>
      <div
        className={cx(fr.cx("fr-col-12", "fr-col-lg-4"), Styles.sidebarWrapper)}
      >
        {sidebar}
      </div>
    </>
  );
};
