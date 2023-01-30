import { useField } from "formik";
import React from "react";
import { ConventionStatus } from "shared";
import { fr } from "@codegouvfr/react-dsfr";

type SubmitButtonProps = {
  isSubmitting: boolean;
  onSubmit: () => Promise<void>;
  disabled?: boolean;
  id?: string;
};

export const SubmitButton = ({
  onSubmit,
  isSubmitting,
  id = "im-submit-button",
}: SubmitButtonProps) => {
  const [_, __, { setValue }] = useField<ConventionStatus>({ name: "status" });

  const makeInReviewAndSubmit = () => {
    setValue("READY_TO_SIGN");
    return onSubmit();
  };

  return (
    <button
      className={fr.cx(
        "fr-btn",
        "fr-icon-checkbox-circle-line",
        "fr-btn--icon-left",
      )}
      type="button"
      onClick={makeInReviewAndSubmit}
      disabled={isSubmitting}
      id={id}
    >
      Envoyer la demande
    </button>
  );
};
