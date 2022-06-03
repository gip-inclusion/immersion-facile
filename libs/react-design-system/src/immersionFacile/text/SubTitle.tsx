import React from "react";
import { TitleProps } from "./Title";

export const SubTitle = ({ children, red }: TitleProps) => (
  <div
    className={`${
      red ? "text-immersionRed-dark" : "text-immersionBlue-dark"
    } font-semibold text-center py-4`}
  >
    {children}
  </div>
);
