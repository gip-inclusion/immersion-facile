import { fr } from "@codegouvfr/react-dsfr";
import Badge from "@codegouvfr/react-dsfr/Badge";
import Table from "@codegouvfr/react-dsfr/Table";
import type { ReactNode } from "react";
import type { EstablishmentData } from "shared";
import { establishmentRoleToDisplay } from "../establishment-users";
import { EstablishmentLineAdminsInfos } from "./establishment-line/EstablishmentLineAdminInfos";
import { EstablishmentLineBusinessName } from "./establishment-line/EstablishmentLineBusinessName";

export const EstablishmentsRightsTable = ({
  withEstablishmentData,
}: {
  withEstablishmentData: EstablishmentData[];
}) => (
  <>
    <h2 className={fr.cx("fr-h4")}>
      {withEstablishmentData.length === 1
        ? "Établissement rattaché au profil pour accueillir des candidats (1 établissement)"
        : `Établissements rattachés au profil pour accueillir des candidats (${withEstablishmentData.length} établissements)`}
    </h2>

    <Table
      fixed={true}
      headers={["Établissement", "Administrateurs", "Rôle"]}
      data={[...withEstablishmentData]
        .sort((a, b) => a.businessName.localeCompare(b.businessName))
        .map(makeEstablishmentRightLine)}
    />
  </>
);

const makeEstablishmentRightLine = (
  withEstablishmentData: EstablishmentData,
): ReactNode[] => {
  const roleDisplay = establishmentRoleToDisplay[withEstablishmentData.role];
  return [
    EstablishmentLineBusinessName({ withEstablishmentData }),
    EstablishmentLineAdminsInfos({ withEstablishmentData }),
    <Badge
      small
      className={fr.cx(roleDisplay.className, "fr-mr-1w")}
      key={roleDisplay.label}
    >
      {roleDisplay.label}
    </Badge>,
  ];
};
