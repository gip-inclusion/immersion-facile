import { fr } from "@codegouvfr/react-dsfr";
import Tabs from "@codegouvfr/react-dsfr/Tabs";
import { useMemo } from "react";
import { Loader, PageHeader, SectionHighlight } from "react-design-system";
import {
  type BeneficiaryDashboardTab,
  domElementIds,
  frontRoutes,
} from "shared";
import { DiscussionTabContent } from "src/app/components/discussion/DiscussionTabContent";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import type { DashboardTab } from "src/app/utils/dashboard";
import { connectedUserSelectors } from "src/core-logic/domain/connected-user/connectedUser.selectors";
import { discussionSelectors } from "src/core-logic/domain/discussion/discussion.selectors";
import { BeneficiaryConventionTabContent } from "../../components/beneficiary/ConventionTab/BeneficiaryConventionTabContent";
import {
  ConnectedPrivateRoutePage,
  type FrontBeneficiaryDashboardRoute,
} from "../auth/ConnectedPrivateRoutePage";
import {
  beneficiaryDashboardRouteNameFromTabId,
  beneficiaryDashboardTabFromRouteName,
  isBeneficiaryDashboardTab,
} from "./beneficiaryDashboard.utils";

export const BeneficiaryDashboardPage = ({
  route,
}: {
  route: FrontBeneficiaryDashboardRoute;
}) => {
  const currentTab = useMemo(
    () => beneficiaryDashboardTabFromRouteName[route.name],
    [route.name],
  );
  const isLoadingUser = useAppSelector(connectedUserSelectors.isLoading);
  const isLoadingDiscussionList = useAppSelector(discussionSelectors.isLoading);

  const controlledTabs = makeControlledTabs(tabs, currentTab);

  return (
    <ConnectedPrivateRoutePage
      route={route}
      oAuthConnectionPageHeader={
        <PageHeader title="Vous devez vous connecter pour accéder à votre espace candidat" />
      }
    >
      {(isLoadingUser || isLoadingDiscussionList) && <Loader />}
      <h1>Mon espace bénéficiaire</h1>
      <SectionHighlight>
        <h2 className={fr.cx("fr-h6", "fr-mb-1w")}>
          Bienvenue dans votre nouvel espace candidat !
        </h2>
        <p className={fr.cx("fr-text--lg", "fr-mb-2w")}>
          Immersion Facilitée évolue pour simplifier vos démarches. Pour le
          moment, vous pouvez consulter l'historique de vos candidatures et y
          répondre. D'autres services arriveront très prochainement pour vous
          accompagner dans votre parcours.
        </p>
      </SectionHighlight>
      <Tabs
        tabs={controlledTabs}
        id={domElementIds.beneficiaryDashboard.tabContainer}
        className={fr.cx("fr-mt-4w")}
        selectedTabId={currentTab}
        onTabChange={(tab) => {
          if (isBeneficiaryDashboardTab(tab)) {
            const routeName = beneficiaryDashboardRouteNameFromTabId[tab];
            frontRoutes[routeName]().push();
          }
        }}
      >
        {controlledTabs.find((tab) => tab.tabId === currentTab)?.content}
      </Tabs>
    </ConnectedPrivateRoutePage>
  );
};

const tabs: (DashboardTab & { tabId: BeneficiaryDashboardTab })[] = [
  {
    label: "Mes candidatures",
    content: <DiscussionTabContent viewer="potentialBeneficiary" />,
    tabId: "discussions",
  },
  {
    label: "Mes conventions",
    content: <BeneficiaryConventionTabContent />,
    tabId: "conventions",
  },
];

const makeControlledTabs = (
  rawTabs: DashboardTab[],
  currentTab: BeneficiaryDashboardTab,
) =>
  rawTabs.map((tab) => ({
    ...tab,
    tabId: tab.tabId,
    isDefault: currentTab === tab.tabId,
  }));
