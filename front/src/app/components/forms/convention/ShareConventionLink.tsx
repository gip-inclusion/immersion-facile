import { fr } from "@codegouvfr/react-dsfr";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import React, { useState } from "react";
import { createPortal } from "react-dom";
import { useFormContext } from "react-hook-form";
import { ConventionReadDto, domElementIds } from "shared";
import { useConventionTexts } from "src/app/contents/forms/convention/textSetup";
import { useCopyButton } from "src/app/hooks/useCopyButton";
import { match } from "ts-pattern";
import { ShareForm } from "./ShareForm";

const { Component: ShareLinkModal, open: openShareLinkModal } = createModal({
  isOpenedByDefault: false,
  id: "shareLink",
});

export const ShareConventionLink = () => {
  const { getValues } = useFormContext<ConventionReadDto>();
  const { onCopyButtonClick, isCopied, copyButtonIsDisabled } = useCopyButton();
  const t = useConventionTexts(getValues().internshipKind);
  const [emailSent, setEmailSent] = useState<boolean | null>(null);
  const shareLinkByEmail = t.shareLinkByMail.share;
  const getConventionFormData = () => ({
    establishmentRepresentativeEmail:
      getValues().signatories.establishmentRepresentative.email,
    firstName: getValues().signatories.beneficiary.firstName,
    lastName: getValues().signatories.beneficiary.lastName,
    internshipKind: getValues().internshipKind,
  });
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
              <>
                <ShareForm
                  onSuccess={() => {
                    setEmailSent(true);
                  }}
                  onError={() => {
                    setEmailSent(false);
                  }}
                  conventionFormData={getConventionFormData()}
                />
                <p className={fr.cx("fr-hr-or", "fr-mt-3w")}>ou</p>
                <div
                  className={fr.cx("fr-btns-group", "fr-btns-group--center")}
                >
                  <Button
                    type="button"
                    disabled={copyButtonIsDisabled}
                    onClick={() => {
                      onCopyButtonClick(window.location.href);
                    }}
                    id={domElementIds.conventionImmersionRoute.copyLinkButton}
                  >
                    {isCopied ? t.linkCopied : t.copyLinkTooltip}
                  </Button>
                </div>
              </>
            ))
            .exhaustive()}
        </ShareLinkModal>,
        document.body,
      )}
    </>
  );
};
