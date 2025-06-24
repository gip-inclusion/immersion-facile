import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import Tabs from "@codegouvfr/react-dsfr/Tabs";
import { type ReactNode, useMemo } from "react";
import { HeadingSection, SectionHighlight } from "react-design-system";
import type { EstablishmentDashboardTab, InclusionConnectedUser } from "shared";
import { DiscussionList } from "src/app/components/establishment/establishment-dashboard/DiscussionList";
import { DiscussionManageContent } from "src/app/components/establishment/establishment-dashboard/DiscussionManageContent";
import { useFeatureFlags } from "src/app/hooks/useFeatureFlags";
import type {
  EstablishmentDashboardRouteName,
  FrontEstablishmentDashboardRoute,
} from "src/app/pages/auth/ConnectedPrivateRoute";
import { InitiateConventionButton } from "src/app/pages/establishment-dashboard/InitiateConventionButton";
import { ManageEstablishmentsTab } from "src/app/pages/establishment-dashboard/ManageEstablishmentTab";
import { isEstablishmentDashboardTab } from "src/app/routes/routeParams/establishmentDashboardTabs";
import { routes } from "src/app/routes/routes";
import type { DashboardTab } from "src/app/utils/dashboard";
import { MetabaseView } from "../../MetabaseView";
import { SelectConventionFromIdForm } from "../../SelectConventionFromIdForm";

type EstablishmentDashboardTabsProps = {
  currentUser: InclusionConnectedUser;
  route: FrontEstablishmentDashboardRoute;
};

export const EstablishmentDashboardTabs = ({
  currentUser,
  route,
}: EstablishmentDashboardTabsProps): ReactNode => {
  const currentTab = useMemo(
    () => establishmentDashboardTabFromRouteName[route.name],
    [route.name],
  );

  const tabs = useMemo(
    () =>
      getDashboardTabs(
        makeEstablishmentDashboardTabs(currentUser, route),
        currentTab,
      ),
    [currentUser, currentTab, route],
  );
  const { enableEstablishmentDashboardHighlight } = useFeatureFlags();
  const shouldRedirectToMainTab =
    route.name === "establishmentDashboardFormEstablishment" &&
    route.params.siret &&
    !currentUser.establishments?.some(
      (establishment) =>
        establishment.siret === route.params.siret &&
        establishment.role === "establishment-admin",
    );
  if (shouldRedirectToMainTab) {
    routes.establishmentDashboard().push();
    return;
  }
  return (
    <>
      {enableEstablishmentDashboardHighlight.isActive && (
        <SectionHighlight>
          <h2 className={fr.cx("fr-h6", "fr-mb-1w")}>
            {enableEstablishmentDashboardHighlight.value.title}
          </h2>
          <p className={fr.cx("fr-text--lg", "fr-mb-2w")}>
            {enableEstablishmentDashboardHighlight.value.message}
          </p>
          <Button
            size="small"
            linkProps={{
              href: enableEstablishmentDashboardHighlight.value.href,
              target: "_blank",
              rel: "noopener noreferrer",
            }}
          >
            {enableEstablishmentDashboardHighlight.value.label}
          </Button>
        </SectionHighlight>
      )}
      <Tabs
        tabs={tabs}
        className={fr.cx("fr-mt-4w")}
        selectedTabId={currentTab} // shouldn't be necessary as it's handled by isDefault, but typescript complains (should report to react-dsfr)
        onTabChange={(tab) => {
          if (isEstablishmentDashboardTab(tab)) {
            const routeName = establishmentDashboardRouteNameFromTabId[tab];
            routes[routeName]().push();
          }
        }}
      >
        {tabs.find((tab) => tab.tabId === currentTab)?.content}
      </Tabs>
    </>
  );
};

const makeEstablishmentDashboardTabs = (
  {
    dashboards: {
      establishments: { conventions },
    },
    establishments,
  }: InclusionConnectedUser,
  route: FrontEstablishmentDashboardRoute,
): DashboardTab[] => [
  {
    label: "Conventions",
    tabId: "conventions",
    content: (
      <>
        <HeadingSection
          title="Piloter une convention"
          titleAs="h2"
          titleAction={<InitiateConventionButton />}
          className={fr.cx("fr-mt-0")}
        >
          <SelectConventionFromIdForm routeNameToRedirectTo="manageConventionConnectedUser" />
        </HeadingSection>
        {conventions ? (
          <MetabaseView
            title={"Tableau des conventions en cours"}
            subtitle="Cliquer sur l'identifiant de la convention pour y accéder."
            url={conventions}
          />
        ) : (
          <p> Aucune convention trouvée pour votre compte</p>
        )}
      </>
    ),
  },
  {
    label: "Candidatures",
    tabId: "discussions",
    content:
      route.name === "establishmentDashboardDiscussions" &&
      route.params.discussionId ? (
        <DiscussionManageContent discussionId={route.params.discussionId} />
      ) : (
        <DiscussionList />
      ),
  },
  ...(establishments &&
  establishments?.filter(
    (establishment) => establishment.role === "establishment-admin",
  ).length > 0
    ? [
        {
          label:
            establishments.length > 1
              ? "Mes établissements"
              : "Mon établissement",
          tabId: "fiche-entreprise",
          content: (
            <ManageEstablishmentsTab
              establishments={establishments.filter(
                (establishment) => establishment.role === "establishment-admin",
              )}
            />
          ),
        },
      ]
    : []),
];

const getDashboardTabs = (
  rawTabs: DashboardTab[],
  currentTab: EstablishmentDashboardTab,
) =>
  rawTabs.map((tab) => ({
    ...tab,
    tabId: tab.tabId,
    isDefault: currentTab === tab.tabId,
  }));

const establishmentDashboardTabFromRouteName: Record<
  EstablishmentDashboardRouteName,
  EstablishmentDashboardTab
> = {
  establishmentDashboard: "conventions",
  establishmentDashboardConventions: "conventions",
  establishmentDashboardFormEstablishment: "fiche-entreprise",
  establishmentDashboardDiscussions: "discussions",
};

const establishmentDashboardRouteNameFromTabId: Record<
  EstablishmentDashboardTab,
  EstablishmentDashboardRouteName
> = {
  conventions: "establishmentDashboard",
  discussions: "establishmentDashboardDiscussions",
  "fiche-entreprise": "establishmentDashboardFormEstablishment",
};
