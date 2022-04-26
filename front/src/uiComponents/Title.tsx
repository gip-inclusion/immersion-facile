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
interface EstablishmentTitleContract {
  text: string;
  type: "establishment" | "candidate";
}
export const EstablishmentTitle = ({
  text,
  type,
}: EstablishmentTitleContract) => (
  <div
    className={`${
      type === "establishment"
        ? "text-immersionBlue-dark"
        : "text-immersionRed-dark"
    }  text-center font-semibold py-2 tracking-widest`}
  >
    {text}
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
interface EstablishmentSubTitleContract {
  text: string;
  type: "establishment" | "candidate";
}
export const EstablishmentSubTitle = ({
  text,
  type,
}: EstablishmentSubTitleContract) => (
  <div
    className={`${
      type === "establishment"
        ? "text-immersionBlue-dark"
        : "text-immersionRed-dark"
    }  text-center`}
    style={{ maxWidth: "16rem" }}
  >
    {text}
  </div>
);
