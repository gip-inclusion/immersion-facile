import React from "react";

// TODO: refacto with ui-component/Title

export interface EstablishmentSubTitleContract {
  text: string;
  type: "establishment" | "candidate" | "candidateForm";
}

export const EstablishmentSubTitle = ({
  text,
  type,
}: EstablishmentSubTitleContract) => (
  <p
    className={`${
      type === "establishment"
        ? "text-immersionBlue-dark fr-mt-2w fr-mb-1v"
        : "text-immersionRed-dark fr-my-2w"
    } ${type === "candidateForm" ? "font-bold" : ""} text-center`}
    style={{ maxWidth: "18rem" }}
  >
    {text}
  </p>
);
