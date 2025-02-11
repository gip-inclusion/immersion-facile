import { fr } from "@codegouvfr/react-dsfr";
import { InputProps } from "@codegouvfr/react-dsfr/Input";
import React from "react";
import Select, { Props as SelectProps } from "react-select";

export type RSAutocompleteProps = InputProps & {
  selectProps: SelectProps;
};

export const RSAutocomplete = ({
  label,
  hintText,
  state,
  stateRelatedMessage,
}: RSAutocompleteProps) => {
  const hasError = state === "error";
  return (
    <div className="fr-input-group">
      <label className="fr-label" htmlFor="text-input-groups1">
        {label}
        {hintText && <span className="fr-hint-text">{hintText}</span>}
      </label>
      <input
        className={fr.cx("fr-input", { "fr-input--error": hasError })}
        type="text"
        id="text-input-groups1"
        name="text-input-groups1"
      />
      <Select />

      {hasError && (
        <p id="text-input-error-desc-error" className="fr-error-text">
          {stateRelatedMessage}
        </p>
      )}
    </div>
  );
};
