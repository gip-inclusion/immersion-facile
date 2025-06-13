import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import Tabs from "@codegouvfr/react-dsfr/Tabs";
import { type ReactNode, useMemo } from "react";
import { SectionHighlight } from "react-design-system";
import { HeadingSection } from "react-design-system";
import type { EstablishmentDashboardTab, InclusionConnectedUser } from "shared";
import { useFeatureFlags } from "src/app/hooks/useFeatureFlags";
import { InitiateConventionButton } from "src/app/pages/establishment-dashboard/InitiateConventionButton";
import { ManageDiscussionFormSection } from "src/app/pages/establishment-dashboard/ManageDiscussionFormSection";
import { ManageEstablishmentsTab } from "src/app/pages/establishment-dashboard/ManageEstablishmentTab";
import type {
  EstablishmentDashboardRouteName,
  FrontEstablishmentDashboardRoute,
} from "src/app/routes/ConnectedPrivateRoute";
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
      getDashboardTabs(makeEstablishmentDashboardTabs(currentUser), currentTab),
    [currentUser, currentTab],
  );
  const { enableEstablishmentDashboardHighlight } = useFeatureFlags();
  const shouldRedirectToMainTab =
    route.name === "establishmentDashboardFicheEntreprise" &&
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

const makeEstablishmentDashboardTabs = ({
  dashboards: {
    establishments: { conventions, discussions },
  },
  firstName,
  lastName,
  establishments,
}: InclusionConnectedUser): DashboardTab[] => [
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
    content: (
      <>
        <HeadingSection
          title="Gérer une candidature"
          titleAs="h2"
          className={fr.cx("fr-mt-0")}
        >
          <ManageDiscussionFormSection />
        </HeadingSection>
        {discussions ? (
          <MetabaseView
            title={`Suivi des candidatures pour ${firstName} ${lastName}`}
            url={discussions}
          />
        ) : (
          <p>
            {" "}
            Nous n'avons pas trouvé de candidatures où vous êtes référencés en
            tant que contact d'entreprise.
          </p>
        )}
      </>
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
  establishmentDashboardFicheEntreprise: "fiche-entreprise",
  establishmentDashboardDiscussionDetail: "discussions",
};

const establishmentDashboardRouteNameFromTabId: Record<
  EstablishmentDashboardTab,
  EstablishmentDashboardRouteName
> = {
  conventions: "establishmentDashboard",
  discussions: "establishmentDashboardDiscussionDetail",
  "fiche-entreprise": "establishmentDashboardFicheEntreprise",
};
