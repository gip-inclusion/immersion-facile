import checked from "/checked.svg";
import React from "react";

type CardProps = {
  boldText: string;
  text: string;
};
export const Card = ({ boldText, text }: CardProps) => (
  <div className="p-2 m-2 w-48 bg-blue-50 rounded flex flex-col items-center">
    <img src={checked} alt="checked-icon" height="10px" />
    <div className="text-immersionBlue-dark font-semibold text-center">
      {boldText}
    </div>
    <div className="text-center font-light">{text}</div>
  </div>
);
