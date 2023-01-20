import { fr } from "@codegouvfr/react-dsfr";
import classNames, { ArgumentArray } from "classnames";
import React from "react";

type ModalTitleProperties = {
  children: React.ReactNode;
  className: ArgumentArray;
};

export const ModalTitle = ({ children, className }: ModalTitleProperties) => (
  <h1
    className={classNames("fr-modal__title", className)}
    id="fr-modal-title-modal"
  >
    <span className={fr.cx("fr-icon-arrow-right-line", "fr-icon--lg")}></span>
    {children}
  </h1>
);

ModalTitle.defaultProps = {
  __TYPE: "ModalTitle",
  icon: "",
  className: "",
};
