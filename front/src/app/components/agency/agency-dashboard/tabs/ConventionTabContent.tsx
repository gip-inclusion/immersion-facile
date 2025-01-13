import { WithAgencyDashboards, WithEstablishmentDashboards } from "shared";
import { MetabaseView } from "../../../MetabaseView";
import { SelectConventionFromIdForm } from "../../../SelectConventionFromIdForm";

export const ConventionTabContent = (
  dashboards: WithAgencyDashboards & WithEstablishmentDashboards,
) => (
  <>
    <SelectConventionFromIdForm routeNameToRedirectTo="manageConventionInclusionConnected" />
    <MetabaseView
      title="Tableau de bord agence"
      subtitle="Cliquer sur l'identifiant de la convention pour y accéder."
      url={dashboards.agencies.agencyDashboardUrl}
    />
  </>
);
