import React, { useEffect, useState } from "react";
import { fr } from "@codegouvfr/react-dsfr";
import { useStyles } from "tss-react/dsfr";
import { z } from "zod";
import {
  cleanStringToHTMLAttribute,
  notEqual,
  OmitFromExistingKeys,
  validateMultipleEmailRegex,
} from "shared";

const componentName = "im-fillable-list";

export const MultipleEmailsInput = (
  props: OmitFromExistingKeys<
    InputContainerProps,
    "onInputChange" | "value"
  > & {
    initialValue?: string;
    valuesInList: string[];
    setValues: (values: string[]) => void;
    disabled?: boolean;
    summaryHintText?: string;
  },
) => {
  const {
    valuesInList,
    setValues,
    disabled,
    summaryHintText,
    ...addToListProps
  } = props;
  const { cx } = useStyles();
  const getEmailValuesFromString = (stringToParse: string) => {
    const matches = stringToParse.match(validateMultipleEmailRegex);
    return (matches || []).map((match) => match.trim());
  };

  const [inputValue, setInputValue] = useState<string>(
    addToListProps.initialValue ?? "",
  );

  const onInputChange: OnInputChange = (event) => {
    const { value } = event.target;
    const updatedValues = [...new Set([...getEmailValuesFromString(value)])];
    setValues(updatedValues);
    setInputValue(value);
  };

  useEffect(() => {
    if (!addToListProps.initialValue) return;
    setInputValue(addToListProps.initialValue);
  }, [addToListProps.initialValue]);

  return (
    <div className={cx(fr.cx("fr-input-group"), componentName)}>
      <InputContainer
        {...addToListProps}
        value={inputValue}
        onInputChange={onInputChange}
        disabled={disabled}
      />
      {valuesInList.length > 0 && (
        <EmailsValuesSummary
          values={valuesInList}
          disabled={disabled}
          onDelete={(valueToDelete) => {
            const newEmails = valuesInList.filter(notEqual(valueToDelete));
            setValues(newEmails);
            setInputValue(newEmails.join(", "));
          }}
          summaryHintText={summaryHintText}
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
  description?: React.ReactNode;
  validationSchema?: z.ZodSchema<unknown>;
  disabled?: boolean;
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
  disabled,
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
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                event.currentTarget.blur();
              }
            }}
            disabled={disabled}
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
  disabled?: boolean;
  summaryHintText?: string;
};

const EmailsValuesSummary = ({
  values,
  summaryHintText,
  onDelete,
  disabled,
}: EmailsValuesSummaryProps) => (
  <div className={`${componentName}__list-of-chip`}>
    <span className={fr.cx("fr-hint-text")}>
      {summaryHintText ??
        "Voici les adresses emails qui seront ajoutées en copie :"}
    </span>
    <ul className={fr.cx("fr-tags-group", "fr-mt-1w")}>
      <li>
        {values.map((value) => (
          <button
            className={fr.cx("fr-tag", "fr-tag--dismiss")}
            onClick={() => onDelete(value)}
            key={value}
            aria-label={`Supprimer l'adresse email ${value}`}
            disabled={disabled}
          >
            {value}
          </button>
        ))}
      </li>
    </ul>
  </div>
);
