import { fr } from "@codegouvfr/react-dsfr";
import Table from "@codegouvfr/react-dsfr/Table";
import { ReactNode } from "react";
import { AgencyRight } from "shared";
import { AgencyLineAdminEmails } from "./agency-line/AgencyLineAdminEmails";
import { AgencyLineAgencyName } from "./agency-line/AgencyLineAgencyName";
import { AgencyLineCaracteristics } from "./agency-line/AgencyLineCaracteristics";

export const OnGoingAgencyRightsTable = ({
  agenciesWithToReviewRights,
}: { agenciesWithToReviewRights: AgencyRight[] }) => (
  <>
    <h2 className={fr.cx("fr-h4")}>
      Demandes d'accès en cours ({agenciesWithToReviewRights.length}{" "}
      {agenciesWithToReviewRights.length === 1 ? "agence" : "agences"})
    </h2>
    <Table
      headers={["Organisme", "Caractéristiques de l'agence", "Administrateurs"]}
      data={agenciesWithToReviewRights
        .sort((a, b) => a.agency.name.localeCompare(b.agency.name))
        .map(makeAgencyWithToReviewRightLine())}
    />
  </>
);

const makeAgencyWithToReviewRightLine =
  () =>
  (agencyRight: AgencyRight): ReactNode[] => [
    AgencyLineAgencyName({ agencyRight }),
    AgencyLineCaracteristics({ agencyRight }),
    AgencyLineAdminEmails({ agencyRight }),
  ];
