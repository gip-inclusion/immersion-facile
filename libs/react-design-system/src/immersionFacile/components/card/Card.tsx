import React from "react";
import { Image } from "../image/Image";

export type CardProps = {
  imageUrl: string;
  boldText: string;
  text: string;
};
export const Card = ({ imageUrl, boldText, text }: CardProps) => (
  <div className="p-2 m-2 w-48 bg-blue-50 rounded flex flex-col items-center">
    <Image url={imageUrl} alt="checked-icon" height="10px" />
    <div className="text-immersionBlue-dark font-semibold text-center">
      {boldText}
    </div>
    <div className="text-center font-light">{text}</div>
  </div>
);
