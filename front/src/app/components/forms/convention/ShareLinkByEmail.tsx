import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import { IconButton, Tooltip } from "@mui/material";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import React, { useState } from "react";
import { useConventionTextsFromFormikContext } from "src/app/contents/forms/convention/textSetup";
import {
  ElementModalContainer,
  useElementContainerModal,
} from "src/app/components/forms/commons/FormModal/ElementModalContainer";
import { ShareForm } from "./ShareForm";

const iconColor = "#3458a2";

export const ShareLinkByEmail = () => {
  const t = useConventionTextsFromFormikContext();
  const { modalState, dispatch } = useElementContainerModal();
  const [emailSent, setEmailSent] = useState<boolean | null>(null);
  const shareLinkByEmail = t.shareLinkByMail.share;

  return (
    <>
      <Tooltip title={shareLinkByEmail}>
        <IconButton onClick={() => dispatch({ type: "CLICKED_OPEN" })}>
          <EmailOutlinedIcon sx={{ color: iconColor }} />
        </IconButton>
      </Tooltip>
      <ElementModalContainer
        modalState={modalState}
        dispatch={dispatch}
        title={shareLinkByEmail}
      >
        <ShareForm
          onSuccess={() => {
            dispatch({ type: "CLICKED_CLOSE" });
            setEmailSent(true);
          }}
          onError={() => {
            dispatch({ type: "CLICKED_CLOSE" });
            setEmailSent(false);
          }}
        />
      </ElementModalContainer>
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
