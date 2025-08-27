import { fr } from "@codegouvfr/react-dsfr";
import { useDispatch } from "react-redux";
import {
  type AgencyRight,
  distinguishAgencyRights,
  domElementIds,
  type User,
  type UserParamsForAgency,
} from "shared";
import { removeUserFromAgencySlice } from "src/core-logic/domain/agencies/remove-user-from-agency/removeUserFromAgency.slice";
import { updateUserOnAgencySlice } from "src/core-logic/domain/agencies/update-user-on-agency/updateUserOnAgency.slice";
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
      {toReviewAgencyRights.length > 0 && (
        <>
          <h2 className={fr.cx("fr-h4")}>
            Demandes d'accès en cours ({toReviewAgencyRights.length}{" "}
            {toReviewAgencyRights.length === 1 ? "agence" : "agences"})
          </h2>

          <AgencyRightsTable
            agencyRights={toReviewAgencyRights}
            user={user}
            title={`Demandes d'accès en cours (${toReviewAgencyRights.length})`}
            modalId={domElementIds.admin.agencyTab.editAgencyManageUserModal}
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
          title={`Organismes rattachés au profil (${activeAgencyRights.length} ${activeAgencyRights.length === 1 ? "agence" : "agences"})`}
          isBackofficeAdmin={isBackofficeAdmin}
          modalId={domElementIds.admin.agencyTab.editAgencyManageUserModal}
          onUserUpdateRequested={onUserUpdateRequested("user")}
        />
      )}
    </>
  );
};
