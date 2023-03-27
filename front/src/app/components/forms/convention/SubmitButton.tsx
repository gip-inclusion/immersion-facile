import React from "react";
import { ConventionReadDto } from "shared";
import { fr } from "@codegouvfr/react-dsfr";
import { useFormContext } from "react-hook-form";

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
  const { setValue } = useFormContext<ConventionReadDto>();
  const makeInReviewAndSubmit = () => {
    setValue("status", "READY_TO_SIGN");
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
