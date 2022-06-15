import React from "react";

type SignOnlyMessageProps = {
  isAlreadySigned: boolean;
};

export const ConventionSignOnlyMessage = ({
  isAlreadySigned,
}: SignOnlyMessageProps) => (
  <>
    <div role="alert" className="fr-alert fr-alert--info">
      <p className="fr-alert__title">
        {isAlreadySigned
          ? "Vous avez déjà signé cette demande d'immersion."
          : "Cette demande d'immersion est prête à être signée."}
      </p>
      <p>
        {"Cette demande d'immersion n'est plus modifiable. " +
          (isAlreadySigned
            ? "Vous avez déjà signé cette demande d'immersion."
            : "Veuillez la signer ou la renvoyer pour modification.")}
      </p>
    </div>
    <br />
  </>
);
