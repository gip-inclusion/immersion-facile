import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import { useDispatch } from "react-redux";
import {
  type AgencyRight,
  distinguishAgencyRights,
  domElementIds,
  type User,
  type UserParamsForAgency,
} from "shared";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { routes } from "src/app/routes/routes";
import { removeUserFromAgencySlice } from "src/core-logic/domain/agencies/remove-user-from-agency/removeUserFromAgency.slice";
import { updateUserOnAgencySlice } from "src/core-logic/domain/agencies/update-user-on-agency/updateUserOnAgency.slice";
import { connectedUserSelectors } from "src/core-logic/domain/connected-user/connectedUser.selectors";
import type { FeedbackTopic } from "src/core-logic/domain/feedback/feedback.content";
import { Feedback } from "../../feedback/Feedback";
import { AgencyRightsTable } from "./AgencyRightsTable";

export const AgenciesTablesSection = ({
  user,
  agencyRights,
  isBackofficeAdmin,
}: {
  user: User;
  agencyRights: AgencyRight[];
  isBackofficeAdmin?: boolean;
}) => {
  const dispatch = useDispatch();

  const currentUser = useAppSelector(connectedUserSelectors.currentUser);

  if (!currentUser) return <p>Vous n'êtes pas connecté...</p>;

  if (!agencyRights.length)
    return <p>Cet utilisateur n'est lié à aucun organisme.</p>;

  const { toReviewAgencyRights, activeAgencyRights } =
    distinguishAgencyRights(agencyRights);

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

  const onUserRegistrationCancelledRequested =
    (feedbackTopic: FeedbackTopic) => (agencyRight: AgencyRight) => {
      dispatch(
        removeUserFromAgencySlice.actions.removeUserFromAgencyRequested({
          agencyId: agencyRight.agency.id,
          feedbackTopic,
          userId: user.id,
        }),
      );
    };
  return (
    <>
      <Feedback topics={["user"]} closable />
      <div className={fr.cx("fr-grid-row")}>
        <Button
          id={domElementIds.profile.registerAgenciesSearchLink}
          priority="primary"
          linkProps={{
            href: `${routes.myProfileAgencyRegistration().href}`,
          }}
          iconId="fr-icon-add-line"
          className={fr.cx("fr-ml-auto")}
        >
          Se rattacher à un organisme
        </Button>
      </div>

      {toReviewAgencyRights.length > 0 && (
        <>
          <h2 className={fr.cx("fr-h4")}>
            Demandes d'accès en cours ({toReviewAgencyRights.length}{" "}
            {toReviewAgencyRights.length === 1 ? "agence" : "agences"})
          </h2>

          <AgencyRightsTable
            agencyRights={toReviewAgencyRights}
            user={user}
            onUserRegistrationCancelledRequested={onUserRegistrationCancelledRequested(
              "user",
            )}
          />
        </>
      )}
      {activeAgencyRights.length > 0 && (
        <AgencyRightsTable
          agencyRights={activeAgencyRights}
          user={user}
          isBackofficeAdmin={isBackofficeAdmin}
          modalId={domElementIds.admin.agencyTab.editAgencyManageUserModal}
          onUserUpdateRequested={onUserUpdateRequested("user")}
        />
      )}
    </>
  );
};
