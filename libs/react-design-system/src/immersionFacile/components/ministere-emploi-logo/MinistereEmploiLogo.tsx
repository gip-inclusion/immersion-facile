import React from "react";
import { fr } from "@codegouvfr/react-dsfr";
import Styles from "./MinistereEmploiLogo.styles";

export const MinistereEmploiLogo = () => (
  <div className={fr.cx("fr-footer__logo")}>
    <p className={fr.cx("fr-logo") + " " + Styles.text}>
      Ministère
      <br />
      du travail,
      <br />
      du plein emploi
      <br />
      et de l'insertion
    </p>
  </div>
);
