import React from "react";
type ButtonGroupProps = {
  children: React.ReactNode;
  className?: string;
};

export const ButtonsGroup = function ({
  children,
  className,
}: ButtonGroupProps) {
  return (
    <ul className={`fr-btns-group ${className ?? ""}`}>
      {Array.isArray(children)
        ? children.map((element, index) => <li key={index}>{element}</li>)
        : children}
    </ul>
  );
};
