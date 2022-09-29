import classNames from "classnames";
import React from "react";

type ModalContentProperties = {
  children: React.ReactNode;
  className: string | object | [];
};

export const ModalContent = ({
  children,
  className,
}: ModalContentProperties) => (
  <div className={classNames(className)}>{children}</div>
);

ModalContent.defaultProps = { __TYPE: "ModalContent", className: "" };
