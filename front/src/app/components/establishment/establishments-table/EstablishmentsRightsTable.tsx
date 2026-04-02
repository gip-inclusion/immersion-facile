import { fr } from "@codegouvfr/react-dsfr";
import Badge from "@codegouvfr/react-dsfr/Badge";
import Table from "@codegouvfr/react-dsfr/Table";
import type { ReactNode } from "react";
import type { UserEstablishmentRightDetails } from "shared";
import { establishmentRoleToDisplay } from "../establishment-users";
import { EstablishmentLineAdminsInfos } from "./establishment-line/EstablishmentLineAdminInfos";
import { EstablishmentLineBusinessName } from "./establishment-line/EstablishmentLineBusinessName";

export const EstablishmentsRightsTable = ({
  withEstablishmentData,
  isBackofficeAdmin,
}: {
  withEstablishmentData: UserEstablishmentRightDetails[];
  isBackofficeAdmin?: boolean;
}) => (
  <>
    <Table
      fixed={true}
      headers={["Établissement", "Administrateurs", "Rôle"]}
      data={[...withEstablishmentData]
        .sort((a, b) => a.businessName.localeCompare(b.businessName))
        .map((data) => makeEstablishmentRightLine({ data, isBackofficeAdmin }))}
    />
  </>
);

const makeEstablishmentRightLine = ({
  data,
  isBackofficeAdmin,
}: {
  data: UserEstablishmentRightDetails;
  isBackofficeAdmin?: boolean;
}): ReactNode[] => {
  const roleDisplay = establishmentRoleToDisplay[data.role];
  return [
    EstablishmentLineBusinessName({ data, isBackofficeAdmin }),
    EstablishmentLineAdminsInfos({ data }),
    <Badge
      small
      className={fr.cx(roleDisplay.className, "fr-mr-1w")}
      key={roleDisplay.label}
    >
      {roleDisplay.label}
    </Badge>,
  ];
};
