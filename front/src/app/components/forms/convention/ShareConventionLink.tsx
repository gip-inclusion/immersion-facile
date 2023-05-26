import React, { useState } from "react";
import { createPortal } from "react-dom";
import { useFormContext } from "react-hook-form";
import { fr } from "@codegouvfr/react-dsfr";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import { ConventionReadDto } from "shared";
import { useConventionTexts } from "src/app/contents/forms/convention/textSetup";
import { useCopyButton } from "src/app/hooks/useCopyButton";
import { ShareForm } from "./ShareForm";

const { ShareLinkModal, openShareLinkModal, closeShareLinkModal } = createModal(
  {
    isOpenedByDefault: false,
    name: "shareLink",
  },
);

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
          setIsModalOpened(true);
        }}
        priority="secondary"
      >
        Partager la convention
      </Button>
      {createPortal(
        <ShareLinkModal title={shareLinkByEmail}>
          <ShareForm
            onSuccess={() => {
              closeShareLinkModal();
              setEmailSent(true);
              setIsModalOpened(false);
            }}
            onError={() => {
              closeShareLinkModal();
              setEmailSent(false);
              setIsModalOpened(false);
            }}
            conventionFormData={getConventionFormData()}
          />
          <p className={fr.cx("fr-hr-or", "fr-mt-3w")}>ou</p>
          <div className={fr.cx("fr-btns-group", "fr-btns-group--center")}>
            <Button
              type="button"
              disabled={copyButtonIsDisabled}
              onClick={() => {
                onCopyButtonClick(window.location.href);
              }}
            >
              {isCopied ? t.linkCopied : t.copyLinkTooltip}
            </Button>
          </div>
        </ShareLinkModal>,
        document.body,
      )}

      {emailSent != null && (
        <Snackbar
          open={true}
          autoHideDuration={4000}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <Alert
            severity={emailSent ? "success" : "error"}
            sx={{ width: "100%" }}
          >
            {emailSent
              ? t.shareLinkByMail.sharedSuccessfully
              : t.shareLinkByMail.errorWhileSharing}
          </Alert>
        </Snackbar>
      )}
    </>
  );
};
