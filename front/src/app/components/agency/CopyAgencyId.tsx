import { fr } from "@codegouvfr/react-dsfr";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import React from "react";
import { CopyButton } from "react-design-system";
import { AgencyId } from "shared";

export const CopyAgencyId = ({ agencyId }: { agencyId: AgencyId }) => {
  return (
    <div>
      Id de l'agence : <Badge severity="success">{agencyId}</Badge>{" "}
      <CopyButton
        label="Copier"
        textToCopy={agencyId}
        withIcon={true}
        className={fr.cx("fr-ml-1v")}
      />
    </div>
  );
};
