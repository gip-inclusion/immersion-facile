import { fr } from "@codegouvfr/react-dsfr";
import Badge from "@codegouvfr/react-dsfr/Badge";
import type { ReactNode } from "react";
import { ResponsiveTable } from "react-design-system";
import {
  type EstablishmentUserRightStatus,
  getDisplayedBusinessName,
  type UserEstablishmentRightDetails,
  type UserEstablishmentRightDetailsWithAcceptedStatus,
  type UserEstablishmentRightDetailsWithPendingStatus,
} from "shared";
import { match } from "ts-pattern";
import { establishmentRoleToDisplay } from "../establishment-users";
import { EstablishmentLineAdminsInfos } from "./establishment-line/EstablishmentLineAdminInfos";
import { EstablishmentLineBusinessName } from "./establishment-line/EstablishmentLineBusinessName";
import { EstablishmentLineDesiredRoleInfos } from "./establishment-line/EstablishmentLineDesiredRoleInfos";

export const EstablishmentsRightsTable = ({
  withEstablishmentData,
  isBackofficeAdmin,
}: {
  withEstablishmentData: UserEstablishmentRightDetails[];
  isBackofficeAdmin?: boolean;
}) => (
  <>
    <ResponsiveTable
      headers={getEstablishmentRightLineHeaders(
        withEstablishmentData[0].status,
      )}
      data={[...withEstablishmentData]
        .sort((a, b) =>
          getDisplayedBusinessName(a).localeCompare(
            getDisplayedBusinessName(b),
          ),
        )
        .map((data) =>
          makeEstablishmentRightLine({
            data,
            isBackofficeAdmin,
            isEstablishmentBanned: data.isEstablishmentBanned,
          }),
        )}
    />
  </>
);

const getEstablishmentRightLineHeaders = (
  status: EstablishmentUserRightStatus,
) => {
  const strategy: Record<EstablishmentUserRightStatus, string[]> = {
    ACCEPTED: ["Entreprise", "Administrateurs", "Rôle"],
    PENDING: ["Entreprise", "Rôle et préférences demandés"],
  };
  return strategy[status];
};
const makeEstablishmentRightLine = ({
  data,
  isEstablishmentBanned,
  isBackofficeAdmin,
}: {
  data:
    | UserEstablishmentRightDetailsWithAcceptedStatus
    | UserEstablishmentRightDetailsWithPendingStatus;
  isEstablishmentBanned: boolean;
  isBackofficeAdmin?: boolean;
}): ReactNode[] => {
  const roleDisplay = establishmentRoleToDisplay[data.role];
  return match(data)
    .with({ status: "ACCEPTED" }, (data) => [
      <EstablishmentLineBusinessName
        key={data.siret}
        data={data}
        isEstablishmentBanned={isEstablishmentBanned}
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
    ])
    .with({ status: "PENDING" }, (data) => [
      <EstablishmentLineBusinessName
        key={data.siret}
        data={data}
        isEstablishmentBanned={isEstablishmentBanned}
        isBackofficeAdmin={isBackofficeAdmin}
      />,
      <EstablishmentLineDesiredRoleInfos key={data.siret} data={data} />,
    ])
    .exhaustive();
};
