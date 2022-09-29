import classNames from "classnames";
import React from "react";

type ModalFooterProperties = {
  children: JSX.Element;
  className: string | object | [];
};

export const ModalFooter = ({ children, className }: ModalFooterProperties) => (
  <div className={classNames("fr-modal__footer", className)}>{children}</div>
);

ModalFooter.defaultProps = { __TYPE: "ModalFooter", className: "" };

export default ModalFooter;
