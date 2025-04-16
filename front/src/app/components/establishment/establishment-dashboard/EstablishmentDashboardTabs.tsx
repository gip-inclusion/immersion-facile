import Tabs from "@codegouvfr/react-dsfr/Tabs";
import type { ReactNode } from "react";
import type {
  ConventionEstablishmentRole,
  EstablishmentDashboardTab,
  InclusionConnectedUser,
} from "shared";
import { ManageDiscussionFormSection } from "src/app/pages/establishment-dashboard/ManageDiscussionFormSection";
import { ManageEstablishmentsTab } from "src/app/pages/establishment-dashboard/ManageEstablishmentTab";
import { isEstablishmentDashboardTab } from "src/app/routes/routeParams/establishmentDashboardTabs";
import { routes } from "src/app/routes/routes";
import type { DashboardTab } from "src/app/utils/dashboard";
import type { Route } from "type-route";
import { MetabaseView } from "../../MetabaseView";
import { SelectConventionFromIdForm } from "../../SelectConventionFromIdForm";
import { DiscussionManageContent } from "../../admin/establishments/DiscussionManageContent";

type EstablishmentDashboardTabsProps = {
  currentUser: InclusionConnectedUser;
  route: Route<typeof routes.establishmentDashboard>;
};

export const EstablishmentDashboardTabs = ({
  currentUser,
  route,
}: EstablishmentDashboardTabsProps): ReactNode => {
  const tabs = getDashboardTabs(
    makeEstablishmentDashboardTabs(currentUser, route),
    route.params.tab,
  );

  return (
    <Tabs
      tabs={tabs}
      selectedTabId={route.params.tab} // shouldn't be necessary as it's handled by isDefault, but typescript complains (should report to react-dsfr)
      onTabChange={(tab) => {
        if (isEstablishmentDashboardTab(tab))
          routes
            .establishmentDashboard({
              tab,
            })
            .push();
      }}
    >
      {tabs.find((tab) => tab.tabId === route.params.tab)?.content}
    </Tabs>
  );
};

const makeEstablishmentDashboardTabs = (
  {
    dashboards: {
      establishments: { conventions, discussions },
    },
    firstName,
    lastName,
    establishments,
  }: InclusionConnectedUser,
  route: Route<typeof routes.establishmentDashboard>,
): DashboardTab[] => [
  {
    label: "Conventions",
    tabId: "conventions",
    content: (
      <>
        <SelectConventionFromIdForm routeNameToRedirectTo="manageConventionConnectedUser" />
        {conventions ? (
          <MetabaseView
            title={`Tableau des conventions en cours
              pour le ${currentUserRoleToDisplay(
                conventions.role,
              )} ${firstName} ${lastName}`}
            subtitle="Cliquer sur l'identifiant de la convention pour y accéder."
            url={conventions.url}
          />
        ) : (
          <p>
            {" "}
            Nous n'avons pas trouvé de convention où vous êtes référencés en
            tant que responsable ou tuteur d'entreprise.
          </p>
        )}
      </>
    ),
  },
  {
    label: "Candidatures",
    tabId: "discussions",
    content: route.params.discussionId ? (
      <DiscussionManageContent discussionId={route.params.discussionId} />
    ) : (
      <>
        <ManageDiscussionFormSection />
        {discussions ? (
          <MetabaseView
            title={`Suivi des mises en relations pour ${firstName} ${lastName}`}
            url={discussions}
          />
        ) : (
          <p>
            {" "}
            Nous n'avons pas trouvé de mises en relation où vous êtes référencés
            en tant que contact d'entreprise.
          </p>
        )}
      </>
    ),
  },
  ...(establishments
    ? [
        {
          label: "Fiche établissement",
          tabId: "fiche-entreprise",
          content: (
            <ManageEstablishmentsTab
              establishments={establishments.filter(
                (establishment) => establishment.role === "establishment-admin",
              )}
              route={route}
            />
          ),
        },
      ]
    : []),
];

const currentUserRoleToDisplay = (role: ConventionEstablishmentRole) =>
  role === "establishment-representative"
    ? "responsable d'entreprise"
    : "tuteur de l'entreprise";

const getDashboardTabs = (
  rawTabs: DashboardTab[],
  currentTab: EstablishmentDashboardTab,
) =>
  rawTabs.map((tab) => ({
    ...tab,
    tabId: tab.tabId,
    isDefault: currentTab === tab.tabId,
  }));
