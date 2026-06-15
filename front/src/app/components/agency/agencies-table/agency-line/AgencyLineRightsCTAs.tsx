import Button from "@codegouvfr/react-dsfr/Button";
import type { ReactNode } from "react";
import { type AgencyRight, domElementIds, frontRoutes } from "shared";

export const AgencyLineRightsCTAs = ({
  agencyRight,
  isBackofficeAdmin,
  onUpdateClicked,
  onRegistrationCancelledClicked,
}: {
  agencyRight: AgencyRight;
  onUpdateClicked?: (agencyRight: AgencyRight) => void;
  onRegistrationCancelledClicked?: (agencyRight: AgencyRight) => void;
  isBackofficeAdmin?: boolean | undefined;
}): ReactNode => (
  <>
    {onUpdateClicked && (
      <Button
        size="small"
        priority="secondary"
        id={`${domElementIds.myAccount.editRoleButton}-${agencyRight.agency.id}`}
        onClick={() => {
          onUpdateClicked(agencyRight);
        }}
      >
        Modifier
      </Button>
    )}
    {isBackofficeAdmin && (
      <Button
        priority="tertiary no outline"
        id={`${domElementIds.myAccount.adminAgencyLink}-${agencyRight.agency.id}`}
        size="small"
        linkProps={
          frontRoutes.adminAgencyDetail({
            agencyId: agencyRight.agency.id,
          }).link
        }
      >
        Voir l'agence comme admin IF
      </Button>
    )}
    {onRegistrationCancelledClicked && (
      <Button
        priority="secondary"
        id={`${domElementIds.myAccount.cancelRegistrationButton}-${agencyRight.agency.id}`}
        size="small"
        onClick={() => {
          onRegistrationCancelledClicked(agencyRight);
        }}
      >
        Annuler la demande
      </Button>
    )}
  </>
);
