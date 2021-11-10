import React from "react";

type TitleProps = { children: string; red?: boolean };

export const Title = ({ children, red }: TitleProps) => (
  <div
    className={`${
      red ? "text-immersionRed" : "text-immersionBlue-dark"
    } text-xl font-semibold my-10 max-w-md text-center`}
  >
    {children}
  </div>
);
