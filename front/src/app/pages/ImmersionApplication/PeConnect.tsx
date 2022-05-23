import React from "react";
import { loginPeConnect } from "shared/src/routes";
import { useFeatureFlags } from "src/app/utils/useFeatureFlags";

export const PeConnect = () => {
  const featureFlags = useFeatureFlags();

  if (!featureFlags.enablePeConnectApi) return null;
  return (
    <>
      <div className="fr-text">
        <p>
          <b>
            (Optionnel) Vous connecter avec votre identifiant Pôle emploi pour
            accélérer le traitement de votre demande de convention.
          </b>
        </p>
      </div>

      <div className="pe-connect flex justify-center">
        <a
          href={`/api/${loginPeConnect}`}
          className="button-pe-connect"
          title=""
        >
          <img
            className="icon-pe-connect"
            src="/pe-connect-barre-nav-b.svg"
            alt=""
            width="300"
            height="75"
          />
          <img
            className="icon-pe-connect-hover"
            src="/pe-connect-barre-nav-b-o.svg"
            alt=""
            width="300"
            height="75"
          />
        </a>
      </div>
    </>
  );
};
