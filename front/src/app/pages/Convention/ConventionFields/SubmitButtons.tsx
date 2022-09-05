import { useField } from "formik";
import React from "react";
import { ConventionStatus } from "shared/src/convention/convention.dto";

type SubmitButtonProps = {
  isSubmitting: boolean;
  onSubmit: () => Promise<void>;
};

export const SubmitButton = ({ onSubmit, isSubmitting }: SubmitButtonProps) => {
  const [_, __, { setValue }] = useField<ConventionStatus>({ name: "status" });

  const makeInReviewAndSubmit = () => {
    setValue("READY_TO_SIGN");
    return onSubmit();
  };

  return (
    <button
      className="fr-btn fr-fi-checkbox-circle-line fr-btn--icon-left"
      type="button"
      onClick={makeInReviewAndSubmit}
    >
      {isSubmitting ? "Éxecution" : "Envoyer la demande"}
    </button>
  );
};

export const SignButton = ({ onSubmit, isSubmitting }: SubmitButtonProps) => (
  <button
    className="fr-btn fr-fi-checkbox-circle-line fr-btn--icon-left"
    type="button"
    onClick={onSubmit}
  >
    {isSubmitting ? "Éxecution" : "Confirmer et signer"}
  </button>
);

export const RequestModificationButton = ({
  onSubmit,
  isSubmitting,
}: SubmitButtonProps) => (
  <button
    className="fr-btn fr-fi-edit-fill fr-btn--icon-left fr-btn--secondary"
    type="button"
    onClick={onSubmit}
  >
    {isSubmitting
      ? "Éxecution"
      : "Annuler les signatures et demander des modifications"}
  </button>
);
