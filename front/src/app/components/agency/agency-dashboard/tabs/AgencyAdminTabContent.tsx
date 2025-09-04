import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import { HeadingSection, useScrollToTop } from "react-design-system";
import { useDispatch } from "react-redux";
import type { UserParamsForAgency } from "shared";
import { type AgencyRight, type ConnectedUser, domElementIds } from "shared";
import { AgencyRightsTable } from "src/app/components/agency/agencies-table/AgencyRightsTable";
import { Feedback } from "src/app/components/feedback/Feedback";
import { useFeedbackTopics } from "src/app/hooks/feedback.hooks";
import { routes } from "src/app/routes/routes";
import { updateUserOnAgencySlice } from "src/core-logic/domain/agencies/update-user-on-agency/updateUserOnAgency.slice";
import type { FeedbackTopic } from "src/core-logic/domain/feedback/feedback.content";

export const AgencyAdminTabContent = ({
  activeAgencyRights,
  currentUser,
}: {
  activeAgencyRights: AgencyRight[];
  currentUser: ConnectedUser;
}) => {
  const dispatch = useDispatch();

  const agenciesUserIsAdminOn = activeAgencyRights.filter((agencyRight) =>
    agencyRight.roles.includes("agency-admin"),
  );
  const agenciesUserIsNotAdminOn = activeAgencyRights.filter(
    (agencyRight) => !agencyRight.roles.includes("agency-admin"),
  );

  useScrollToTop(useFeedbackTopics(["agency-user-for-dashboard"]).length > 0);

  const onUserUpdateRequested =
    (feedbackTopic: FeedbackTopic) =>
    (userParamsForAgency: UserParamsForAgency) => {
      dispatch(
        updateUserOnAgencySlice.actions.updateUserAgencyRightRequested({
          ...userParamsForAgency,
          feedbackTopic,
        }),
      );
    };

  const proConnectSiret = currentUser.proConnect?.siret;
  const hasAgencyRoleOnProConnectSiret =
    activeAgencyRights.filter(
      (agencyRight) => agencyRight.agency.agencySiret === proConnectSiret,
    ).length > 0;

  return (
    <>
      <Feedback
        topics={["agency-user-for-dashboard"]}
        closable
        className={fr.cx("fr-mb-2w", "fr-mt-0")}
      />
      <HeadingSection
        className={fr.cx("fr-mt-0")}
        title="Mes Organismes"
        titleAs="h2"
        titleAction={
          <Button
            id={
              domElementIds.agencyDashboard.dashboard.initiateConventionButton
            }
            linkProps={
              routes.addAgency({
                siret: hasAgencyRoleOnProConnectSiret
                  ? undefined
                  : proConnectSiret,
              }).link
            }
          >
            Inscrire un nouvel organisme
          </Button>
        }
      >
        {agenciesUserIsAdminOn.length > 0 && (
          <AgencyRightsTable
            agencyRights={agenciesUserIsAdminOn}
            user={currentUser}
            title={`Organismes sur lesquels vous êtes administrateur (${agenciesUserIsAdminOn.length} organismes)`}
            modalId={domElementIds.agencyDashboard.agencyTab.adminRightsModal}
            onUserUpdateRequested={onUserUpdateRequested(
              "agency-user-for-dashboard",
            )}
          />
        )}

        {agenciesUserIsNotAdminOn.length > 0 && (
          <AgencyRightsTable
            agencyRights={agenciesUserIsNotAdminOn}
            user={currentUser}
            title={`Organismes auquels vous êtes rattaché (${agenciesUserIsNotAdminOn.length} organismes)`}
            modalId={domElementIds.agencyDashboard.agencyTab.userRightsModal}
            onUserUpdateRequested={onUserUpdateRequested(
              "agency-user-for-dashboard",
            )}
          />
        )}
      </HeadingSection>
    </>
  );
};
