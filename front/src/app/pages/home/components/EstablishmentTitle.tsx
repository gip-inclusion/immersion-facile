import React from "react";

// TODO: refacto with ui-component/Title

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
    }  text-center font-semibold py-2 tracking-widest`}>
    {text}
  </div>
);
