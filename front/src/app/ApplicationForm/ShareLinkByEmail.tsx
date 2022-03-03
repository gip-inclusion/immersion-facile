import React, { useState } from "react";
import { IconButton, Tooltip } from "@mui/material";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import { ShareForm } from "src/app/ApplicationForm/ShareForm";
import {
  ElementModalContainer,
  useElementContainerModal,
} from "../../components/FormModal/ElementModalContainer";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

const iconColor = "#3458a2";

export const ShareLinkByEmail = () => {
  const { modalState, dispatch } = useElementContainerModal();
  const [emailSent, setEmailSent] = useState<boolean | null>(null);
  const shareLinkByEmail = "Partagez cette demande de convention par e-mail";
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
              ? "Cette demande de convention a bien été partagée par mail."
              : "Erreur lors de l'envoi de l'email"}
          </Alert>
        </Snackbar>
      )}
    </>
  );
};
