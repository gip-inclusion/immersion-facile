import React, { ReactNode } from "react";

export type TitleProps = {
  children: ReactNode;
  red?: boolean;
  heading?: 1 | 2 | 3 | 4;
};

export const Title = ({ children, red, heading }: TitleProps) => {
  const Tag: keyof JSX.IntrinsicElements = heading ? `h${heading}` : "div";
  return (
    <Tag
      className={`${
        red ? "text-immersionRed" : "text-immersionBlue-dark"
      } text-2xl font-semibold my-6 text-center`}
    >
      {children}
    </Tag>
  );
};
