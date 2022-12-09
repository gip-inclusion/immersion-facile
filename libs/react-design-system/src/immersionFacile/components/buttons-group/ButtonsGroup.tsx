import React from "react";
type ButtonGroupProps = {
  children: React.ReactChild[];
  className?: string;
};

export const ButtonsGroup = function ({
  children,
  className,
}: ButtonGroupProps) {
  return (
    <ul className={`fr-btns-group ${className ?? ""}`}>
      {children.map((child, index) => (
        <li key={index}>{child}</li>
      ))}
    </ul>
  );
};
