import React from "react";

// TODO: refacto with ui-component/Title

export interface EstablishmentSubTitleContract {
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
