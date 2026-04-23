import { fr } from "@codegouvfr/react-dsfr";
import Tabs from "@codegouvfr/react-dsfr/Tabs";
import { Loader, SectionHighlight } from "react-design-system";
import { domElementIds } from "shared";
import { DiscussionTabContent } from "src/app/components/DiscussionContentTab";

import { useAppSelector } from "src/app/hooks/reduxHooks";
import { routes } from "src/app/routes/routes";
import { connectedUserSelectors } from "src/core-logic/domain/connected-user/connectedUser.selectors";
import { discussionSelectors } from "src/core-logic/domain/discussion/discussion.selectors";

export const BeneficiaryDashboardPage = () => {
  const isLoadingUser = useAppSelector(connectedUserSelectors.isLoading);
  const isLoadingDiscussionList = useAppSelector(discussionSelectors.isLoading);

  return (
    <>
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
        tabs={[
          {
            label: "Mes candidatures",
            content: <DiscussionTabContent viewer="potentialBeneficiary" />,
          },
        ]}
        id={domElementIds.beneficiaryDashboard.tabContainer}
        className={fr.cx("fr-mt-4w")}
        onTabChange={() => {
          routes.beneficiaryDashboardDiscussions().push();
        }}
      />
    </>
  );
};
