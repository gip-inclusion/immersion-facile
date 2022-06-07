import React from "react";

export type ColoredProps = { red?: boolean; children: string };
export const Colored = ({ red, children }: ColoredProps) => {
  const textColor = red ? "text-immersionRed-dark" : "text-immersionBlue-dark";
  return <span className={`font-bold ${textColor}`}>{children}</span>;
};
