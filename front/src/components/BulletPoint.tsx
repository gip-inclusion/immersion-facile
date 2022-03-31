import React, { ReactNode } from "react";
import arrow from "/fleche.svg";

type WithNumAndColor = { num?: number; red?: boolean };
const ArrowOrNumber = ({ num, red }: WithNumAndColor) => {
  const background = red ? "bg-red-100" : "bg-blue-100";
  const textColor = red ? "text-immersionRed-dark" : "text-immersionBlue-dark";

  return num !== undefined ? (
    <div
      className={`rounded-full ${background} ${textColor} text-immersionRed h-7 w-7 p-2 flex justify-center items-center`}
    >
      {num}
    </div>
  ) : (
    <div className={`rounded-full ${background} h-7 w-7 p-2`}>
      <div
        className="h-3 w-3"
        style={{
          backgroundImage: `url(${arrow})`,
          backgroundSize: "cover",
        }}
      />
    </div>
  );
};

type BulletPointProps = WithNumAndColor & {
  children: ReactNode;
};
export const BulletPoint = ({ children, red, num }: BulletPointProps) => (
  <div className="flex py-1 text-sm">
    <ArrowOrNumber red={red} num={num} />
    <div className="flex-1 ml-4 inline-block">{children}</div>
  </div>
);
