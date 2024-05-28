import { fr } from "@codegouvfr/react-dsfr";
import React from "react";
import { useStyles } from "tss-react/dsfr";
import FooterStyles from "../footer/Footer.styles";
import Styles from "./MinistereEmploiLogo.styles";

export const MinistereEmploiLogo = () => {
  const { cx } = useStyles();
  return (
    <p
      className={cx(
        fr.cx("fr-logo", "fr-footer__logo"),
        FooterStyles.logo,
        Styles.text,
      )}
    >
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
