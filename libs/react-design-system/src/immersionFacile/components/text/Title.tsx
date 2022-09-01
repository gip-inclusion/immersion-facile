import React, { ReactNode } from "react";

export type TitleProps = { children: ReactNode; red?: boolean };

export const Title = ({ children, red }: TitleProps) => (
  <div
    className={`${
      red ? "text-immersionRed" : "text-immersionBlue-dark"
    } text-2xl font-semibold my-6 text-center`}>
    {children}
  </div>
);
