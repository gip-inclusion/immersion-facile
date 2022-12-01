import React from "react";
import { useConventionTextsFromFormikContext } from "src/app/contents/convention/textSetup";

type SignOnlyMessageProps = {
  isAlreadySigned: boolean;
};

export const ConventionSignOnlyMessage = ({
  isAlreadySigned,
}: SignOnlyMessageProps) => {
  const t = useConventionTextsFromFormikContext();

  return (
    <div role="alert" className="fr-alert fr-alert--info">
      <p className="fr-alert__title">
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
