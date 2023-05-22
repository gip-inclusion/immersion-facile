import React from "react";
import { fr } from "@codegouvfr/react-dsfr";
import { useStyles } from "tss-react/dsfr";
import Styles from "./ConventionFormLayout.styles";

export const ConventionFormLayout = ({
  form,
  sidebar,
}: {
  form: React.ReactNode;
  sidebar: React.ReactNode;
}) => {
  const { cx } = useStyles();
  return (
    <>
      <div className={cx(fr.cx("fr-col-12", "fr-col-lg-8"))}>{form}</div>
      <div
        className={cx(fr.cx("fr-col-12", "fr-col-lg-4"), Styles.sidebarWrapper)}
      >
        {sidebar}
      </div>
    </>
  );
};
