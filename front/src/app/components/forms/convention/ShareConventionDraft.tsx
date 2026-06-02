import { Button, type ButtonProps } from "@codegouvfr/react-dsfr/Button";
import { useIsModalOpen } from "@codegouvfr/react-dsfr/Modal/useIsModalOpen";
import { createPortal } from "react-dom";
import { useDispatch } from "react-redux";
import { domElementIds } from "shared";
import { useConventionTexts } from "src/app/contents/forms/convention/textSetup";
import { useFeedbackTopic } from "src/app/hooks/feedback.hooks";
import { createFormModal } from "src/app/utils/createFormModal";
import { feedbackSlice } from "src/core-logic/domain/feedback/feedback.slice";
import { ShareForm, type ShareFormProps } from "./ShareForm";

const shareConventionDraftModalProps = {
  isOpenedByDefault: false,
  id: "shareLink",
  formId: domElementIds.conventionImmersion.shareConventionDraft.shareForm,
};
const shareConventionDraftModal = createFormModal(
  shareConventionDraftModalProps,
);

export const ShareConventionDraft = ({
  conventionFormData,
}: ShareFormProps) => {
  const dispatch = useDispatch();
  const t = useConventionTexts(conventionFormData.internshipKind);
  const shareLinkByEmail = t.shareConventionDraftByMail.share;
  const conventionDraftFeedback = useFeedbackTopic("convention-draft");

  const closeModalButton: ButtonProps = {
    children: "Fermer",
    type: "button",
    priority: "secondary",
    onClick: shareConventionDraftModal.close,
    id: domElementIds.conventionImmersion.shareConventionDraft
      .shareFormCancelButton,
  };

  const submitConventionDraftButton: ButtonProps = {
    children: "Envoyer le brouillon",
    type: "submit",
    id: domElementIds.conventionImmersion.shareConventionDraft
      .shareFormSubmitButton,
  };

  useIsModalOpen(shareConventionDraftModalProps, {
    onConceal: () => {
      dispatch(feedbackSlice.actions.clearFeedbacksTriggered());
    },
  });

  return (
    <>
      <Button
        type="button"
        iconId="fr-icon-draft-line"
        onClick={() => {
          shareConventionDraftModal.open();
        }}
        nativeButtonProps={{
          id: domElementIds.conventionImmersion.shareConventionDraft
            .shareButton,
        }}
        priority="secondary"
      >
        Partager ou enregistrer un brouillon
      </Button>
      {createPortal(
        <shareConventionDraftModal.Component
          title={shareLinkByEmail}
          doSubmitClosesModal={false}
          buttons={[
            closeModalButton,
            ...(!conventionDraftFeedback ? [submitConventionDraftButton] : []),
          ]}
        >
          <ShareForm conventionFormData={conventionFormData} />
        </shareConventionDraftModal.Component>,
        document.body,
      )}
    </>
  );
};
