import { Button } from "@codegouvfr/react-dsfr/Button";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { useState } from "react";
import { createPortal } from "react-dom";
import { useFormContext } from "react-hook-form";
import { type ConventionPresentation, domElementIds } from "shared";
import { useConventionTexts } from "src/app/contents/forms/convention/textSetup";
import { match } from "ts-pattern";
import { ShareForm } from "./ShareForm";

const {
  Component: ShareConventionDraftModal,
  open: openShareConventionDraftModal,
} = createModal({
  isOpenedByDefault: false,
  id: "shareLink",
});

export const ShareConventionDraft = () => {
  const { getValues } = useFormContext<ConventionPresentation>();
  const t = useConventionTexts(getValues().internshipKind);
  const [emailSent, setEmailSent] = useState<boolean | null>(null);
  const shareLinkByEmail = t.shareConventionDraftByMail.share;
  const [_isModalOpened, setIsModalOpened] = useState(false);
  return (
    <>
      <Button
        type="button"
        iconId="fr-icon-mail-line"
        onClick={() => {
          openShareConventionDraftModal();
          setEmailSent(null);
          setIsModalOpened(true);
        }}
        nativeButtonProps={{
          id: domElementIds.conventionImmersionRoute.shareButton,
        }}
        priority="secondary"
      >
        Partager la convention
      </Button>
      {createPortal(
        <ShareConventionDraftModal title={shareLinkByEmail}>
          {match(emailSent)
            .with(true, () => t.shareConventionDraftByMail.sharedSuccessfully)
            .with(false, () => t.shareConventionDraftByMail.errorWhileSharing)
            .with(null, () => (
              <ShareForm
                onSuccess={() => {
                  setEmailSent(true);
                }}
                onError={() => {
                  setEmailSent(false);
                }}
                conventionFormData={getValues()}
              />
            ))
            .exhaustive()}
        </ShareConventionDraftModal>,
        document.body,
      )}
    </>
  );
};
