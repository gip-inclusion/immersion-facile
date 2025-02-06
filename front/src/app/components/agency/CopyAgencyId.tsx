import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { Button } from "@codegouvfr/react-dsfr/Button";
import React from "react";
import { useCopyButton } from "react-design-system";
import { AgencyId } from "shared";

export const CopyAgencyId = ({ agencyId }: { agencyId: AgencyId }) => {
  const { copyButtonIsDisabled, copyButtonLabel, onCopyButtonClick } =
    useCopyButton("Copier");

  return (
    <div>
      Id de l'agence : <Badge severity="success">{agencyId}</Badge>{" "}
      <Button
        type="button"
        disabled={copyButtonIsDisabled}
        iconId={"fr-icon-clipboard-fill"}
        onClick={() => onCopyButtonClick(agencyId)}
      >
        {copyButtonLabel}
      </Button>
    </div>
  );
};
