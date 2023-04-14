import React from "react";
import { fr } from "@codegouvfr/react-dsfr";
import { InternshipKind } from "shared";
import { useConventionTexts } from "src/app/contents/forms/convention/textSetup";

type SignOnlyMessageProps = {
  isAlreadySigned: boolean;
  internshipKind: InternshipKind;
};

export const ConventionSignOnlyMessage = ({
  isAlreadySigned,
}: SignOnlyMessageProps) => {
  const t = useConventionTexts("immersion");

  return (
    <div
      role="alert"
      className={fr.cx(
        "fr-alert",
        isAlreadySigned ? "fr-alert--success" : "fr-alert--info",
      )}
    >
      <p className={fr.cx("fr-alert__title")}>
        {isAlreadySigned
          ? t.conventionAlreadySigned
          : t.conventionReadyToBeSigned}
      </p>
      <p>
        {`${t.conventionNotEditable} ` +
          (isAlreadySigned
            ? t.conventionAlreadySigned
            : t.conventionToSignOrAskForChanges)}
      </p>
    </div>
  );
};
