import Alert from "@codegouvfr/react-dsfr/Alert";
import type {
  AgencyRight,
  ConnectedUserJwt,
  WithAgencyDashboards,
  WithEstablishmentDashboards,
} from "shared";
import { MarkPartnersErroredConventionAsHandledFormSection } from "src/app/pages/agency-dashboard/MarkPartnersErroredConventionAsHandledFormSection";
import { MetabaseView } from "../../../MetabaseView";

export const ErroredConventionTabContent = ({
  activeAgencyRights,
  connectedUserJwt,
  dashboards,
}: {
  activeAgencyRights: AgencyRight[];
  connectedUserJwt: ConnectedUserJwt | undefined;
  dashboards: WithAgencyDashboards & WithEstablishmentDashboards;
}) => {
  const isUserHaveFtAgencyRight = activeAgencyRights.some(
    (agencyRight) => agencyRight.agency.kind === "pole-emploi",
  );

  return (
    <>
      {connectedUserJwt ? (
        <MarkPartnersErroredConventionAsHandledFormSection
          jwt={connectedUserJwt}
          isPeUser={isUserHaveFtAgencyRight}
        />
      ) : (
        <Alert
          severity="error"
          title="Non autorisé"
          description="Cette page est reservée aux utilisateurs connectés avec Inclusion Connect, et dont l'organisme est responsable de cette convention."
        />
      )}
      <MetabaseView
        title="Tableau de bord agence"
        url={dashboards.agencies.erroredConventionsDashboardUrl}
      />
    </>
  );
};
