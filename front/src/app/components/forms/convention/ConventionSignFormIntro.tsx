import { fr } from "@codegouvfr/react-dsfr";
import React from "react";
import { ConventionReadDto } from "shared";
import { useConventionTexts } from "../../../contents/forms/convention/textSetup";

type ConventionSignFormIntroProperties = {
  convention: ConventionReadDto;
};

export const ConventionSignFormIntro = ({
  convention,
}: ConventionSignFormIntroProperties): JSX.Element => {
  const t = useConventionTexts(convention.internshipKind);
  return (
    <>
      <h2>{t.sign.title}</h2>

      <div
        className={
          //fr.cx("fr-text") is not supported
          "fr-text"
        }
      >
        {t.sign.summary}
        <p className={fr.cx("fr-text--xs", "fr-mt-1w")}>{t.sign.regulations}</p>
      </div>
    </>
  );
};
