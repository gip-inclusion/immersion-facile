import React from "react";
import classNames from "classnames";

type ModalTitleProperties = {
  children: JSX.Element;
  className: string | object | [];
};

export const ModalTitle = ({ children, className }: ModalTitleProperties) => (
  <h1
    className={classNames("fr-modal__title", className)}
    id="fr-modal-title-modal"
  >
    {children}
  </h1>
);

ModalTitle.defaultProps = {
  __TYPE: "ModalTitle",
  icon: "",
  className: "",
};
