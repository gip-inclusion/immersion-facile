import React from "react";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";

type SuccessFeedbackProps = {
  open: boolean;
  handleClose: () => void;
  children: string;
};

export const SuccessFeedback = ({
  open,
  handleClose,
  children,
}: SuccessFeedbackProps) => (
  <Snackbar open={open} autoHideDuration={8000} onClose={handleClose}>
    <Alert onClose={handleClose} severity="success" sx={{ width: "100%" }}>
      {children}
    </Alert>
  </Snackbar>
);
