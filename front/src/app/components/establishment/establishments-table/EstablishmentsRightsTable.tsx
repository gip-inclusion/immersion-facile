import { fr } from "@codegouvfr/react-dsfr";
import Badge from "@codegouvfr/react-dsfr/Badge";
import Table from "@codegouvfr/react-dsfr/Table";
import type { ReactNode } from "react";
import type {
  EstablishmentUserRightStatus,
  UserEstablishmentRightDetailsWithAcceptedStatus,
  UserEstablishmentRightDetailsWithPendingStatus,
} from "shared";
import { establishmentRoleToDisplay } from "../establishment-users";
import { EstablishmentLineAdminsInfos } from "./establishment-line/EstablishmentLineAdminInfos";
import { EstablishmentLineBusinessName } from "./establishment-line/EstablishmentLineBusinessName";
import { EstablishmentLineDesiredRoleInfos } from "./establishment-line/EstablishmentLineDesiredRoleInfos";

export const EstablishmentsRightsTable = ({
  withEstablishmentData,
  isBackofficeAdmin,
}: {
  withEstablishmentData:
    | UserEstablishmentRightDetailsWithAcceptedStatus[]
    | UserEstablishmentRightDetailsWithPendingStatus[];
  isBackofficeAdmin?: boolean;
}) => (
  <>
    <Table
      fixed={true}
      headers={getEstablishmentRightLineHeaders(
        withEstablishmentData[0].status,
      )}
      data={[...withEstablishmentData]
        .sort((a, b) => a.businessName.localeCompare(b.businessName))
        .map((data) => makeEstablishmentRightLine({ data, isBackofficeAdmin }))}
    />
  </>
);

const getEstablishmentRightLineHeaders = (
  status: EstablishmentUserRightStatus,
) => {
  const strategy: Record<EstablishmentUserRightStatus, string[]> = {
    ACCEPTED: ["Établissement", "Administrateurs", "Rôle"],
    PENDING: ["Établissement", "Rôle et préférences demandées"],
  };
  return strategy[status];
};
const makeEstablishmentRightLine = ({
  data,
  isBackofficeAdmin,
}: {
  data:
    | UserEstablishmentRightDetailsWithAcceptedStatus
    | UserEstablishmentRightDetailsWithPendingStatus;
  isBackofficeAdmin?: boolean;
}): ReactNode[] => {
  const roleDisplay = establishmentRoleToDisplay[data.role];
  return data.status === "ACCEPTED"
    ? [
        <EstablishmentLineBusinessName
          key={data.siret}
          data={data}
          isBackofficeAdmin={isBackofficeAdmin}
        />,
        <EstablishmentLineAdminsInfos key={data.siret} data={data} />,
        <Badge
          small
          className={fr.cx(roleDisplay.className, "fr-mr-1w")}
          key={roleDisplay.label}
        >
          {roleDisplay.label}
        </Badge>,
      ]
    : [
        <EstablishmentLineBusinessName
          key={data.siret}
          data={data}
          isBackofficeAdmin={isBackofficeAdmin}
        />,
        <EstablishmentLineDesiredRoleInfos key={data.siret} data={data} />,
      ];
};
