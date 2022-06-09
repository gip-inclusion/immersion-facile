import React, { ReactNode } from "react";

export type BulletPointNumberProperties = {
  children: ReactNode;
  num?: number;
  red?: boolean;
};
export const BulletPointNumber = ({
  children,
  num,
  red,
}: BulletPointNumberProperties) => {
  const background = red ? "bg-red-100" : "bg-blue-100";
  const textColor = red ? "text-immersionRed-dark" : "text-immersionBlue-dark";
  return (
    <div className="flex py-1 text-sm">
      <div
        className={`rounded-full ${background} ${textColor} text-immersionRed h-7 w-7 p-2 flex justify-center items-center`}
      >
        {num}
      </div>
      <div className="flex-1 ml-4 inline-block">{children}</div>
    </div>
  );
};
