import React, { useState } from "react";
import { createPortal } from "react-dom";
import { useFormContext } from "react-hook-form";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import { IconButton, Tooltip } from "@mui/material";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import { ConventionReadDto } from "shared";
import { useConventionTexts } from "src/app/contents/forms/convention/textSetup";
import { ShareForm } from "./ShareForm";

const iconColor = "#3458a2";

const { ShareLinkModal, openShareLinkModal, closeShareLinkModal } = createModal(
  {
    isOpenedByDefault: false,
    name: "shareLink",
  },
);

export const ShareLinkByEmail = () => {
  const { getValues } = useFormContext<ConventionReadDto>();
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
      <Tooltip title={shareLinkByEmail}>
        <IconButton
          onClick={() => {
            openShareLinkModal();
            setIsModalOpened(true);
          }}
        >
          <EmailOutlinedIcon sx={{ color: iconColor }} />
        </IconButton>
      </Tooltip>
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
