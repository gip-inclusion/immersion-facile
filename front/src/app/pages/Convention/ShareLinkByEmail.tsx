import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import { IconButton, Tooltip } from "@mui/material";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import React, { useState } from "react";
import {
  ElementModalContainer,
  useElementContainerModal,
} from "src/uiComponents/FormModal/ElementModalContainer";
import { ShareForm } from "./ShareForm";

const iconColor = "#3458a2";

export const ShareLinkByEmail = () => {
  const { modalState, dispatch } = useElementContainerModal();
  const [emailSent, setEmailSent] = useState<boolean | null>(null);
  const shareLinkByEmail = "Partagez cette demande de Convention par e-mail";
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
        title={shareLinkByEmail}>
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
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
          <Alert
            severity={emailSent ? "success" : "error"}
            sx={{ width: "100%" }}>
            {emailSent
              ? "Cette demande de Convention a bien été partagée par mail."
              : "Erreur lors de l'envoi de l'email"}
          </Alert>
        </Snackbar>
      )}
    </>
  );
};
