import React from "react";
import classNames, { ArgumentArray } from "classnames";

type ModalFooterProperties = {
  children: JSX.Element;
  className: ArgumentArray;
};

export const ModalFooter = ({ children, className }: ModalFooterProperties) => (
  <div className={classNames("fr-modal__footer", className)}>{children}</div>
);

ModalFooter.defaultProps = { __TYPE: "ModalFooter", className: "" };

export default ModalFooter;
