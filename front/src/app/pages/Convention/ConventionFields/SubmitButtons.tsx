import { useField } from "formik";
import React from "react";
import { ConventionStatus } from "shared";

type SubmitButtonProps = {
  isSubmitting: boolean;
  onSubmit: () => Promise<void>;
  disabled?: boolean;
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
      disabled={isSubmitting}
    >
      Envoyer la demande
    </button>
  );
};

export const SignButton = ({
  onSubmit,
  isSubmitting,
  disabled,
}: SubmitButtonProps) => (
  <button
    className="fr-btn fr-fi-checkbox-circle-line fr-btn--icon-left"
    type="submit"
    onClick={onSubmit}
    disabled={isSubmitting || disabled}
  >
    Confirmer et signer
  </button>
);

export const RequestModificationButton = ({
  onSubmit,
  isSubmitting,
  disabled,
}: SubmitButtonProps) => (
  <button
    className="fr-btn fr-fi-edit-fill fr-btn--icon-left fr-btn--secondary"
    type="submit"
    onClick={onSubmit}
    disabled={isSubmitting || disabled}
  >
    Annuler les signatures et demander des modifications
  </button>
);
