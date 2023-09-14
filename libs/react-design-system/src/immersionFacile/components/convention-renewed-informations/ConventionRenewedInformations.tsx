import React from "react";
import { fr } from "@codegouvfr/react-dsfr";

export const ConventionRenewedInformations = ({
  renewed,
}: {
  renewed: {
    from: string;
    justification: string;
  };
}) => (
  <div className={fr.cx("fr-card", "fr-p-4w", "fr-my-2w")}>
    <span>
      Cette convention est <strong>un renouvellement de la convention</strong>{" "}
      <span className={fr.cx("fr-badge", "fr-badge--blue-cumulus")}>
        {renewed.from}
      </span>{" "}
      pour le motif suivant :
    </span>
    <p className={fr.cx("fr-mb-0")}>
      <em>{renewed.justification}</em>
    </p>
  </div>
);
