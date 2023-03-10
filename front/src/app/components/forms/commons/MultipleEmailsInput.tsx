import { fr } from "@codegouvfr/react-dsfr";
import React, { useEffect, useState } from "react";
import { useStyles } from "tss-react/dsfr";

import {
  cleanStringToHTMLAttribute,
  notEqual,
  OmitFromExistingKeys,
} from "shared";
import { z } from "zod";

const componentName = "im-fillable-list";

export const MultipleEmailsInput = (
  props: OmitFromExistingKeys<InputContainerProps, "onInputChange"> & {
    valuesInList: string[];
    setValues: (values: string[]) => void;
  },
) => {
  const { valuesInList, setValues, ...addToListProps } = props;
  const { cx } = useStyles();
  const getEmailValuesFromString = (stringToParse: string) => {
    const regex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/g;
    const matches = stringToParse.match(regex);
    return (matches || []).map((match) => match.trim());
  };

  const onInputChange = (inputValue: string) => {
    const updatedValues = [
      ...new Set([...getEmailValuesFromString(inputValue)]),
    ];
    setValues(updatedValues);
  };
  return (
    <div className={cx(fr.cx("fr-input-group"), componentName)}>
      <InputContainer {...addToListProps} onInputChange={onInputChange} />
      {valuesInList.length > 0 && (
        <EmailsValuesSummary
          values={valuesInList}
          onDelete={(valueToDelete) => {
            setValues(valuesInList.filter(notEqual(valueToDelete)));
          }}
        />
      )}
    </div>
  );
};

type InputContainerProps = {
  name: string;
  onInputChange: (inputValue: string) => void;
  label?: string;
  placeholder?: string;
  description?: string;
  validationSchema?: z.ZodSchema<unknown>;
};

const createGetInputError =
  (validationSchema?: z.ZodSchema<unknown>) =>
  (stringToValidate: string): string | null => {
    if (!validationSchema) return null;

    try {
      validationSchema.parse(stringToValidate);
      return null;
    } catch (e: any) {
      const zodError: z.ZodError = e;
      return zodError.errors[0].message;
    }
  };

const InputContainer = ({
  name,
  label,
  placeholder,
  description,
  onInputChange,
  validationSchema,
}: InputContainerProps) => {
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const getInputError = createGetInputError(validationSchema);

  useEffect(() => {
    onInputChange(inputValue);
    if (!inputValue || !error) return;
    setError(getInputError(inputValue));
  }, [error, inputValue]);

  return (
    <div
      className={`fr-input-group${
        error ? " fr-input-group--error" : ""
      } ${componentName}__add-to-list-wrapper fr-mb-2w`}
    >
      <label
        className={fr.cx("fr-label")}
        htmlFor={cleanStringToHTMLAttribute(name)}
      >
        {label}
      </label>
      {description && (
        <span className={fr.cx("fr-hint-text")}>{description}</span>
      )}
      <div className={fr.cx("fr-grid-row")}>
        <div className={fr.cx("fr-col")}>
          <input
            id={cleanStringToHTMLAttribute(name)}
            value={inputValue}
            type="text"
            name={name}
            onChange={(event) => setInputValue(event.target.value)}
            className={fr.cx("fr-input", error ? "fr-input--error" : undefined)}
            placeholder={placeholder || ""}
            aria-describedby="text-input-error-desc-error"
          />
        </div>
      </div>
      {error && (
        <p
          id="text-input-email-error-desc-error"
          className={fr.cx("fr-error-text")}
        >
          {error}
        </p>
      )}
    </div>
  );
};

type EmailsValuesSummaryProps = {
  values: string[];
  onDelete: (valueToDelete: string) => void;
};

const EmailsValuesSummary = ({
  values,
  onDelete,
}: EmailsValuesSummaryProps) => (
  <div className={`${componentName}__list-of-chip`}>
    <span className={fr.cx("fr-hint-text")}>
      Voici les adresses emails qui seront ajoutées en copie :
    </span>
    <ul className={fr.cx("fr-tags-group", "fr-mt-1w")}>
      <li>
        {values.map((value) => (
          <button
            className={fr.cx("fr-tag", "fr-tag--dismiss")}
            onClick={() => onDelete(value)}
            key={value}
            arial-label={`Supprimer l'adresse email ${value}`}
          >
            {value}
          </button>
        ))}
      </li>
    </ul>
  </div>
);
