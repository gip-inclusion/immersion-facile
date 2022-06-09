import React, { ReactNode } from "react";

export type BulletPointArrowProperties = {
  children: ReactNode;
  arrowSvgUrl: string;
  red?: boolean;
};
export const BulletPointArrow = ({
  children,
  arrowSvgUrl,
  red,
}: BulletPointArrowProperties) => {
  const background = red ? "bg-red-100" : "bg-blue-100";
  return (
    <div className="flex py-1 text-sm">
      <div className={`rounded-full ${background} h-7 w-7 p-2`}>
        <div
          className="h-3 w-3"
          style={{
            backgroundImage: `url(${arrowSvgUrl})`,
            backgroundSize: "cover",
          }}
        ></div>
      </div>
      <div className="flex-1 ml-4 inline-block">{children}</div>
    </div>
  );
};
