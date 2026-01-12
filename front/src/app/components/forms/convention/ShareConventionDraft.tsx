import { Button } from "@codegouvfr/react-dsfr/Button";
import { createPortal } from "react-dom";
import { useFormContext } from "react-hook-form";
import { type ConventionPresentation, domElementIds } from "shared";
import { Feedback } from "src/app/components/feedback/Feedback";
import { useConventionTexts } from "src/app/contents/forms/convention/textSetup";
import {
  buttonsToModalButtons,
  createFormModal,
} from "src/app/utils/createFormModal";
import { ShareForm } from "./ShareForm";

const shareConventionDraftModalProps = {
  isOpenedByDefault: false,
  id: "shareLink",
  formId: domElementIds.conventionImmersionRoute.shareConventionDraft.shareForm,
};
const shareConventionDraftModal = createFormModal(
  shareConventionDraftModalProps,
);

export const ShareConventionDraft = () => {
  const { getValues } = useFormContext<ConventionPresentation>();
  const t = useConventionTexts(getValues().internshipKind);
  const shareLinkByEmail = t.shareConventionDraftByMail.share;

  return (
    <>
      <Button
        type="button"
        iconId="fr-icon-mail-line"
        onClick={() => {
          shareConventionDraftModal.open();
        }}
        nativeButtonProps={{
          id: domElementIds.conventionImmersionRoute.shareConventionDraft
            .shareButton,
        }}
        priority="secondary"
      >
        Partager la convention
      </Button>
      <Feedback topics={["convention-draft"]} closable />
      {createPortal(
        <shareConventionDraftModal.Component
          title={shareLinkByEmail}
          doSubmitClosesModal={false}
          buttons={buttonsToModalButtons([
            {
              children: "Envoyer le brouillon",
              type: "submit",
              id: domElementIds.conventionImmersionRoute.shareConventionDraft
                .shareFormSubmitButton,
            },
          ])}
        >
          <ShareForm conventionFormData={getValues()} />
        </shareConventionDraftModal.Component>,
        document.body,
      )}
    </>
  );
};
