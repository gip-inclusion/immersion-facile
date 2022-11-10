import React from "react";
type ButtonGroupProps = {
  children: React.ReactNode[];
  className?: string;
};

export const ButtonGroup = function ({
  children,
  className,
}: ButtonGroupProps) {
  return (
    <ul className={`fr-btns-group ${className ?? ""}`}>
      {children.map((element, index) => (
        <li key={index}>{element}</li>
      ))}
    </ul>
  );
};
