import { fr } from "@codegouvfr/react-dsfr";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { useDispatch } from "react-redux";
import { type DiscussionId, type DiscussionKind, domElementIds } from "shared";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";
import { discussionSlice } from "src/core-logic/domain/discussion/discussion.slice";

const modal = createModal({
  isOpenedByDefault: false,
  id: domElementIds.beneficiaryDashboard.discussion.closeDiscussionModal,
});

export const openCloseDiscussionByCandidateModal = (): void => modal.open();

const internshipLabelByDiscussionKind: Record<DiscussionKind, string> = {
  IF: "cette immersion",
  "1_ELEVE_1_STAGE": "ce mini-stage",
};

export const CloseDiscussionByCandidateModal = ({
  discussionId,
  discussionKind,
}: {
  discussionId: DiscussionId;
  discussionKind: DiscussionKind;
}): JSX.Element => {
  const dispatch = useDispatch();
  const connectedUserJwt = useAppSelector(authSelectors.connectedUserJwt);

  return (
    <modal.Component
      title={`Vous n’êtes plus intéressé·e par ${internshipLabelByDiscussionKind[discussionKind]} ?`}
      buttons={[
        {
          id: domElementIds.beneficiaryDashboard.discussion
            .closeDiscussionCancelButton,
          priority: "secondary",
          type: "button",
          children: "Annuler",
        },
        {
          id: domElementIds.beneficiaryDashboard.discussion
            .closeDiscussionSubmitButton,
          priority: "primary",
          type: "button",
          children: "Confirmer",
          disabled: !connectedUserJwt,
          onClick: () => {
            if (!connectedUserJwt) return;
            dispatch(
              discussionSlice.actions.closeDiscussionByCandidateRequested({
                discussionId,
                jwt: connectedUserJwt,
                feedbackTopic: "dashboard-discussion-closed-by-candidate",
              }),
            );
          },
        },
      ]}
    >
      <p>
        Vous pouvez clôturer cette candidature. Attention, cette action est
        définitive.
      </p>
      <p className={fr.cx("fr-mb-0")}>
        Vous pourrez toutefois déposer une nouvelle candidature auprès de cette
        entreprise plus tard, si une offre est toujours disponible.
      </p>
    </modal.Component>
  );
};
