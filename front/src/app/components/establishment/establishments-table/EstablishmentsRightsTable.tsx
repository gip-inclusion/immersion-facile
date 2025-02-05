import { fr } from "@codegouvfr/react-dsfr";
import Badge from "@codegouvfr/react-dsfr/Badge";
import Table from "@codegouvfr/react-dsfr/Table";
import { ReactNode } from "react";
import { WithEstablishmentData } from "shared";
import { establishmentRoleToDisplay } from "../establishment-users";
import { EstablishmentLineAdminsInfos } from "./establishment-line/EstablishmentLineAdminInfos";
import { EstablishmentLineBusinessName } from "./establishment-line/EstablishmentLineBusinessName";

export const EstablishmentsRightsTable = ({
  withEstablishmentData,
}: {
  withEstablishmentData: WithEstablishmentData[];
}) => (
  <>
    <h2 className={fr.cx("fr-h4")}>
      Établissement rattachés au profil pour accueillir des candidats (
      {withEstablishmentData.length}{" "}
      {withEstablishmentData.length === 1 ? "établissement" : "établissements"})
    </h2>

    <Table
      fixed={true}
      headers={["Établissement", "Administrateurs", "Rôle"]}
      data={withEstablishmentData
        .sort((a, b) => a.businessName.localeCompare(b.businessName))
        .map(makeEstablishmentRightLine)}
    />
  </>
);

const makeEstablishmentRightLine = (
  withEstablishmentData: WithEstablishmentData,
): ReactNode[] => {
  const roleDisplay = establishmentRoleToDisplay[withEstablishmentData.role];
  return [
    EstablishmentLineBusinessName({ withEstablishmentData }),
    EstablishmentLineAdminsInfos({ withEstablishmentData }),
    <Badge small className={fr.cx(roleDisplay.className, "fr-mr-1w")}>
      {roleDisplay.label}
    </Badge>,
  ];
};
