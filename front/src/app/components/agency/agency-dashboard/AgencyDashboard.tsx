import Tabs from "@codegouvfr/react-dsfr/Tabs";
import {
  AgencyRight,
  InclusionConnectJwt,
  WithDashboards,
  domElementIds,
} from "shared";
import {
  AgencyDashboardRouteName,
  AgencyTabRoute,
  FrontAgencyDashboardRoute,
  agencyDashboardTabsList,
} from "src/app/routes/InclusionConnectedPrivateRoute";
import { routes } from "src/app/routes/routes";
import { DashboardTab } from "src/app/utils/dashboard";
import { AgencyAdminTabContent } from "./tabs/AgencyAdminTabContent";
import { ConventionTabContent } from "./tabs/ConventionTabContent";
import { ErroredConventionTabContent } from "./tabs/ErroredConventionTabContent";

export const AgencyDashboard = ({
  route,
  inclusionConnectedJwt,
  activeAgencyRights,
  dashboards,
}: {
  route: FrontAgencyDashboardRoute;
  inclusionConnectedJwt: InclusionConnectJwt | undefined;
  activeAgencyRights: AgencyRight[];
} & WithDashboards): JSX.Element => {
  const currentTab = route.name;
  const agencyTabs = rawAgencyDashboardTabs({
    activeAgencyRights,
    dashboards,
    inclusionConnectedJwt,
  });
  return (
    <Tabs
      tabs={agencyTabs.map((tab) => ({
        ...tab,
        isDefault: currentTab === tab.tabId,
      }))}
      id={domElementIds.agencyDashboard.dashboard.tabContainer}
      selectedTabId={currentTab}
      onTabChange={(tab) => {
        if (isAgencyDashboardTabRoute(tab)) routes[tab]().push();
      }}
    >
      {agencyTabs.find((tab) => tab.tabId === currentTab)?.content}
    </Tabs>
  );
};

const rawAgencyDashboardTabs = ({
  dashboards,
  activeAgencyRights,
  inclusionConnectedJwt,
}: {
  inclusionConnectedJwt?: InclusionConnectJwt;
  activeAgencyRights: AgencyRight[];
} & WithDashboards): DashboardTab[] => {
  const agenciesUserIsAdminOn = activeAgencyRights
    .filter((agencyRight) => agencyRight.roles.includes("agency-admin"))
    .map((agencyRightWithAdminRole) => agencyRightWithAdminRole.agency);

  return [
    ...(dashboards.agencies.agencyDashboardUrl
      ? [
          {
            tabId: "agencyDashboardMain" satisfies AgencyDashboardRouteName,
            label: "Tableau de bord",
            content: ConventionTabContent(dashboards),
          },
        ]
      : []),
    ...(dashboards.agencies.erroredConventionsDashboardUrl
      ? [
          {
            tabId:
              "agencyDashboardSynchronisedConventions" satisfies AgencyDashboardRouteName,
            label: "Conventions synchronisées",
            content: ErroredConventionTabContent(
              activeAgencyRights,
              inclusionConnectedJwt,
              dashboards,
            ),
          },
        ]
      : []),
    ...(agenciesUserIsAdminOn.length
      ? [
          {
            tabId: "agencyDashboardAgencies" satisfies AgencyDashboardRouteName,
            label: "Mes Organismes",
            content: AgencyAdminTabContent(agenciesUserIsAdminOn),
          },
        ]
      : []),
  ];
};

const isAgencyDashboardTabRoute = (input: string): input is AgencyTabRoute =>
  agencyDashboardTabsList.includes(input as AgencyTabRoute);
