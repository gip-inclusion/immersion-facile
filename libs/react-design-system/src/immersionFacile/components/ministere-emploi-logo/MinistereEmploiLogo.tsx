import React from "react";
import { fr } from "@codegouvfr/react-dsfr";
import { useStyles } from "tss-react/dsfr";
import Styles from "./MinistereEmploiLogo.styles";

export const MinistereEmploiLogo = () => {
  const { cx } = useStyles();
  return (
    <p className={cx(fr.cx("fr-logo", "fr-footer__logo"), Styles.text)}>
      Ministère
      <br />
      du travail,
      <br />
      de la santé
      <br />
      et des solidarités
    </p>
  );
};
