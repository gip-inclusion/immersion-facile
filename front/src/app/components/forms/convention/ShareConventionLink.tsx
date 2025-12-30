import { Button } from "@codegouvfr/react-dsfr/Button";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { useState } from "react";
import { createPortal } from "react-dom";
import { useFormContext } from "react-hook-form";
import { type ConventionReadDto, domElementIds } from "shared";
import { useConventionTexts } from "src/app/contents/forms/convention/textSetup";
import { match } from "ts-pattern";
import { ShareForm } from "./ShareForm";

const { Component: ShareLinkModal, open: openShareLinkModal } = createModal({
  isOpenedByDefault: false,
  id: "shareLink",
});

export const ShareConventionLink = () => {
  const { getValues } = useFormContext<ConventionReadDto>();
  const t = useConventionTexts(getValues().internshipKind);
  const [emailSent, setEmailSent] = useState<boolean | null>(null);
  const shareLinkByEmail = t.shareLinkByMail.share;
  const [_isModalOpened, setIsModalOpened] = useState(false);
  return (
    <>
      <Button
        type="button"
        iconId="fr-icon-mail-line"
        onClick={() => {
          openShareLinkModal();
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
        <ShareLinkModal title={shareLinkByEmail}>
          {match(emailSent)
            .with(true, () => t.shareLinkByMail.sharedSuccessfully)
            .with(false, () => t.shareLinkByMail.errorWhileSharing)
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
        </ShareLinkModal>,
        document.body,
      )}
    </>
  );
};
