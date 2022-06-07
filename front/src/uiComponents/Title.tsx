import React from "react";

type TitleProps = { children: React.ReactNode; red?: boolean };

export const Title = ({ children, red }: TitleProps) => (
  <div
    className={`${
      red ? "text-immersionRed" : "text-immersionBlue-dark"
    } text-2xl font-semibold my-6 max-w-xl text-center`}
  >
    {children}
  </div>
);

export const SubTitle = ({ children, red }: TitleProps) => (
  <div
    className={`${
      red ? "text-immersionRed-dark" : "text-immersionBlue-dark"
    } font-semibold text-center py-4`}
  >
    {children}
  </div>
);
