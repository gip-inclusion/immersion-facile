import { fr } from "@codegouvfr/react-dsfr";
import { Button } from "@codegouvfr/react-dsfr/Button";
import Tabs from "@codegouvfr/react-dsfr/Tabs";
import { SectionHighlight } from "react-design-system";
import {
  type AgencyRight,
  activeAgencyStatuses,
  type ConnectedUserJwt,
  domElementIds,
  type WithDashboards,
} from "shared";
import { Feedback } from "src/app/components/feedback/Feedback";
import { useFeatureFlags } from "src/app/hooks/useFeatureFlags";
import {
  type AgencyDashboardRouteName,
  type AgencyTabRoute,
  agencyDashboardTabsList,
  type FrontAgencyDashboardRoute,
} from "src/app/pages/auth/ConnectedPrivateRoute";
import { routes } from "src/app/routes/routes";
import type { DashboardTab } from "src/app/utils/dashboard";
import { AgencyAdminTabContent } from "./tabs/AgencyAdminTabContent";
import { ConventionTabContent } from "./tabs/ConventionTabContent";
import { ErroredConventionTabContent } from "./tabs/ErroredConventionTabContent";

export const AgencyDashboard = ({
  route,
  connectedUserJwt,
  activeAgencyRights,
  dashboards,
}: {
  route: FrontAgencyDashboardRoute;
  connectedUserJwt: ConnectedUserJwt | undefined;
  activeAgencyRights: AgencyRight[];
} & WithDashboards): JSX.Element => {
  const currentTab = route.name;
  const agencyTabs = rawAgencyDashboardTabs({
    activeAgencyRights,
    dashboards,
    connectedUserJwt,
  });
  const { enableAgencyDashboardHighlight } = useFeatureFlags();
  return (
    <>
      <Feedback
        topics={["transfer-convention-to-agency"]}
        className="fr-mb-2w"
        closable
      />
      {enableAgencyDashboardHighlight.isActive && (
        <SectionHighlight>
          <h2 className={fr.cx("fr-h6", "fr-mb-1w")}>
            {enableAgencyDashboardHighlight.value.title}
          </h2>
          <p className={fr.cx("fr-text--lg", "fr-mb-2w")}>
            {enableAgencyDashboardHighlight.value.message}
          </p>
          <Button
            size="small"
            linkProps={{
              href: enableAgencyDashboardHighlight.value.href,
              target: "_blank",
              rel: "noopener noreferrer",
            }}
          >
            {enableAgencyDashboardHighlight.value.label}
          </Button>
        </SectionHighlight>
      )}
      <Tabs
        className={fr.cx("fr-mt-4w")}
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
    </>
  );
};

const rawAgencyDashboardTabs = ({
  dashboards,
  activeAgencyRights,
  connectedUserJwt,
}: {
  connectedUserJwt?: ConnectedUserJwt;
  activeAgencyRights: AgencyRight[];
} & WithDashboards): DashboardTab[] => {
  const agenciesUserIsAdminOn = activeAgencyRights
    .filter((agencyRight) => agencyRight.roles.includes("agency-admin"))
    .map((agencyRightWithAdminRole) => agencyRightWithAdminRole.agency);

  const agenciesWithActiveStatus = activeAgencyRights
    .filter(({ agency }) => activeAgencyStatuses.includes(agency.status))
    .map((agencyRight) => agencyRight.agency);

  return [
    ...(dashboards.agencies.agencyDashboardUrl
      ? [
          {
            tabId: "agencyDashboardMain" satisfies AgencyDashboardRouteName,
            label: "Tableau de bord",
            content: (
              <ConventionTabContent
                dashboards={dashboards}
                activeAgencies={agenciesWithActiveStatus}
              />
            ),
          },
        ]
      : []),
    ...(dashboards.agencies.erroredConventionsDashboardUrl
      ? [
          {
            tabId:
              "agencyDashboardSynchronisedConventions" satisfies AgencyDashboardRouteName,
            label: "Conventions synchronisées",
            content: (
              <ErroredConventionTabContent
                activeAgencyRights={activeAgencyRights}
                connectedUserJwt={connectedUserJwt}
                dashboards={dashboards}
              />
            ),
          },
        ]
      : []),
    ...(agenciesUserIsAdminOn.length
      ? [
          {
            tabId: "agencyDashboardAgencies" satisfies AgencyDashboardRouteName,
            label: "Mes Organismes",
            content: (
              <AgencyAdminTabContent
                agenciesUserIsAdminOn={agenciesUserIsAdminOn}
              />
            ),
          },
        ]
      : []),
  ];
};

const isAgencyDashboardTabRoute = (input: string): input is AgencyTabRoute =>
  agencyDashboardTabsList.includes(input as AgencyTabRoute);
