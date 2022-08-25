import React from "react";
import classNames from "classnames";

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
