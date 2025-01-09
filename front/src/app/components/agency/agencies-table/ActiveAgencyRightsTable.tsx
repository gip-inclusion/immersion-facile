import { fr } from "@codegouvfr/react-dsfr";
import Table from "@codegouvfr/react-dsfr/Table";
import { ReactNode } from "react";
import { AgencyRight } from "shared";
import { agencyRoleToDisplay } from "../AgencyUsers";
import { AgencyLineAdminEmails } from "./agency-line/AgencyLineAdminEmails";
import { AgencyLineAgencyName } from "./agency-line/AgencyLineAgencyName";
import { AgencyLineCaracteristics } from "./agency-line/AgencyLineCaracteristics";
import { AgencyLineRightsCTAs } from "./agency-line/AgencyLineRightsCTAs";

export const ActiveAgencyRightsTable = ({
  agenciesWithoutToReviewRights,
  onUpdateClicked,
  isBackofficeAdmin,
}: {
  agenciesWithoutToReviewRights: AgencyRight[];
  onUpdateClicked: (agencyRight: AgencyRight) => void;
  isBackofficeAdmin?: boolean;
}) => (
  <>
    <h2 className={fr.cx("fr-h4")}>
      Organismes rattachés au profil ({agenciesWithoutToReviewRights.length}{" "}
      {agenciesWithoutToReviewRights.length === 1 ? "agence" : "agences"})
    </h2>

    <Table
      headers={[
        "Organisme",
        "Caractéristiques de l'agence",
        "Administrateurs",
        "Roles",
        "Reçoit les notifications",
        "Actions",
      ]}
      data={agenciesWithoutToReviewRights
        .sort((a, b) => a.agency.name.localeCompare(b.agency.name))
        .map(makeAgencyRightLine(onUpdateClicked, isBackofficeAdmin))}
    />
  </>
);

const makeAgencyRightLine =
  (
    onUpdateClicked: (agencyRight: AgencyRight) => void,
    isBackofficeAdmin?: boolean,
  ) =>
  (agencyRight: AgencyRight): ReactNode[] => [
    AgencyLineAgencyName({ agencyRight }),
    AgencyLineCaracteristics({ agencyRight }),
    AgencyLineAdminEmails({ agencyRight }),
    agencyRight.roles.map((role) => agencyRoleToDisplay[role].label).join(", "),
    agencyRight.isNotifiedByEmail ? "Oui" : "Non",
    AgencyLineRightsCTAs({
      agencyRight,
      onUpdateClicked,
      isBackofficeAdmin,
    }),
  ];
