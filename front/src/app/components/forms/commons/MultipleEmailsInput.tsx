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
  props: OmitFromExistingKeys<
    InputContainerProps,
    "onInputChange" | "value"
  > & {
    initialValue?: string;
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

  const [inputValue, setInputValue] = useState(
    addToListProps.initialValue ?? "",
  );

  const onInputChange: OnInputChange = (event) => {
    const { value } = event.target;
    const updatedValues = [...new Set([...getEmailValuesFromString(value)])];
    setValues(updatedValues);
    setInputValue(value);
  };

  return (
    <div className={cx(fr.cx("fr-input-group"), componentName)}>
      <InputContainer
        {...addToListProps}
        value={inputValue}
        onInputChange={onInputChange}
      />
      {valuesInList.length > 0 && (
        <EmailsValuesSummary
          values={valuesInList}
          onDelete={(valueToDelete) => {
            const newEmails = valuesInList.filter(notEqual(valueToDelete));
            setValues(newEmails);
            setInputValue(newEmails.join(", "));
          }}
        />
      )}
    </div>
  );
};

type OnInputChange = (event: React.ChangeEvent<HTMLInputElement>) => void;

type InputContainerProps = {
  name: string;
  value: string;
  onInputChange: OnInputChange;
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
  value,
  label,
  placeholder,
  description,
  onInputChange,
  validationSchema,
}: InputContainerProps) => {
  const [error, setError] = useState<string | null>(null);
  const getInputError = createGetInputError(validationSchema);

  useEffect(() => {
    if (!value || !error) return;
    setError(getInputError(value));
  }, [error, value]);

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
            value={value}
            type="text"
            name={name}
            onChange={onInputChange}
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
