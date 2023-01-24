import React from "react";
import { fr } from "@codegouvfr/react-dsfr";

export const ConventionFrozenMessage = () => (
  <div role="alert" className={fr.cx("fr-alert", "fr-alert--info")}>
    <p className={fr.cx("fr-alert__title")}>
      Cette demande d'immersion n'est plus modifiable.
    </p>
    <p>
      Cette demande d'immersion n'est plus modifiable. Veuillez la signer ou
      demander des modifications.
    </p>
  </div>
);
