import { fr } from "@codegouvfr/react-dsfr";
import { Button } from "@codegouvfr/react-dsfr/Button";
import Tabs from "@codegouvfr/react-dsfr/Tabs";
import { SectionHighlight } from "react-design-system";
import {
  type AgencyRight,
  activeAgencyStatuses,
  type ConnectedUser,
  type ConnectedUserJwt,
  domElementIds,
  type WithDashboards,
} from "shared";
import { Feedback } from "src/app/components/feedback/Feedback";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { useFeatureFlags } from "src/app/hooks/useFeatureFlags";
import {
  type AgencyDashboardRouteName,
  type AgencyTabRoute,
  agencyDashboardTabsList,
  type FrontAgencyDashboardRoute,
} from "src/app/pages/auth/ConnectedPrivateRoute";
import { routes } from "src/app/routes/routes";
import type { DashboardTab } from "src/app/utils/dashboard";
import { connectedUserSelectors } from "src/core-logic/domain/connected-user/connectedUser.selectors";
import { MetabaseView } from "../../MetabaseView";
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
  const currentUser = useAppSelector(connectedUserSelectors.currentUser);

  const { enableAgencyDashboardHighlight } = useFeatureFlags();

  if (!currentUser) {
    return <p>Vous n'êtes pas connecté...</p>;
  }

  const agencyTabs = rawAgencyDashboardTabs({
    activeAgencyRights,
    dashboards,
    connectedUserJwt,
    currentUser,
  });

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
        style={{ overflow: "visible" }}
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
  currentUser,
}: {
  connectedUserJwt?: ConnectedUserJwt;
  activeAgencyRights: AgencyRight[];
  currentUser: ConnectedUser;
} & WithDashboards): DashboardTab[] => {
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
              <ConventionTabContent activeAgencies={agenciesWithActiveStatus} />
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
    ...(activeAgencyRights.length
      ? [
          {
            tabId: "agencyDashboardAgencies" satisfies AgencyDashboardRouteName,
            label: "Mes Organismes",
            content: (
              <AgencyAdminTabContent
                activeAgencyRights={activeAgencyRights}
                currentUser={currentUser}
              />
            ),
          },
        ]
      : []),
    ...(dashboards.agencies.statsAgenciesUrl
      ? [
          {
            tabId:
              "agencyDashboardStatsAgencies" satisfies AgencyDashboardRouteName,
            label: "Vue comparée",
            content: (
              <MetabaseView
                title="Vue comparée"
                url={dashboards.agencies.statsAgenciesUrl}
              />
            ),
          },
        ]
      : []),
    ...(dashboards.agencies.statsEstablishmentDetailsUrl ||
    dashboards.agencies.statsConventionsByEstablishmentByDepartmentUrl
      ? [
          {
            tabId:
              "agencyDashboardStatsActivitiesByEstablishment" satisfies AgencyDashboardRouteName,
            label: "Activités par entreprise",
            content: (
              <>
                <MetabaseView
                  title="Détails par entreprise"
                  url={dashboards.agencies.statsEstablishmentDetailsUrl}
                />
                <MetabaseView
                  title="Conventions par entreprise"
                  url={
                    dashboards.agencies
                      .statsConventionsByEstablishmentByDepartmentUrl
                  }
                />
              </>
            ),
          },
        ]
      : []),
  ];
};

const isAgencyDashboardTabRoute = (input: string): input is AgencyTabRoute =>
  agencyDashboardTabsList.includes(input as AgencyTabRoute);
