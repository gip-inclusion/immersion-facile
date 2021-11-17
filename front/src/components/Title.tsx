import React from "react";

type TitleProps = { children: string; red?: boolean };

export const Title = ({ children, red }: TitleProps) => (
  <div
    className={`${
      red ? "text-immersionRed" : "text-immersionBlue-dark"
    } text-2xl font-semibold my-6 max-w-xl text-center`}
  >
    {children}
  </div>
);
