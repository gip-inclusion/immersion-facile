export type TextInputErrorProperties = {
  errorMessage: string;
};

export const TextInputError = ({
  errorMessage,
}: TextInputErrorProperties): JSX.Element => (
  <p id="text-input-email-error-desc-error" className="fr-error-text">
    {JSON.stringify(errorMessage)}
  </p>
);
