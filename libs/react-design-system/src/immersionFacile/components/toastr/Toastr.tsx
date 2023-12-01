import React from "react";
import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import { useStyles } from "tss-react/dsfr";
import Styles from "./Toastr.styles";

export type ToastrProps = {
  isVisible: boolean;
  message: string;
  confirmButton: {
    label: string;
    onClick: () => void;
  };
  dismissButton?: {
    label: string;
    onClick: () => void;
  };
};

export const Toastr = ({
  isVisible,
  confirmButton,
  message,
  dismissButton,
}: ToastrProps) => {
  const { cx } = useStyles();
  if (!isVisible) return null;
  return (
    <div className={cx(fr.cx("fr-alert", "fr-alert--info"), Styles.root)}>
      <p className={fr.cx("fr-mb-2w")}>{message}</p>
      <Button onClick={confirmButton.onClick} size="small">
        {confirmButton.label}
      </Button>
      {dismissButton && (
        <Button
          className={fr.cx("fr-btn--secondary")}
          onClick={dismissButton.onClick}
          size="small"
        >
          {dismissButton.label}
        </Button>
      )}
    </div>
  );
};
