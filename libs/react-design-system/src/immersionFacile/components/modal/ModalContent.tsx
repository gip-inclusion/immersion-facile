import React from "react";
import classNames, { ArgumentArray } from "classnames";

type ModalContentProperties = {
  children: React.ReactNode;
  className: ArgumentArray;
};

export const ModalContent = ({
  children,
  className,
}: ModalContentProperties) => (
  <div className={classNames(className)}>{children}</div>
);

ModalContent.defaultProps = { __TYPE: "ModalContent", className: "" };
