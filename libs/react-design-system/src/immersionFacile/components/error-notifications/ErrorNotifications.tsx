import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import React from "react";
import { useStyles } from "tss-react/dsfr";

const componentName = "im-notification-errors";

const doesSplittedKeyContainsIndex = (key: string[]) =>
  key.length > 1 && !Number.isNaN(Number(key[1]));

export type ErrorNotificationsProps = {
  errors: Record<string, string>;
  labels?: Record<string, string | undefined>;
  visible: boolean;
};

const getErrorLabel = (
  field: string,
  labels?: Record<string, string | undefined>,
) => {
  if (!labels) return field;
  if (field.includes(".") && doesSplittedKeyContainsIndex(field.split("."))) {
    const splittedField = field.split(".");
    const [domain, entryIndex] = splittedField;
    return `${labels[domain]} (${parseInt(entryIndex) + 1})`;
  }
  return labels[field];
};

const ErrorMessage = ({
  error,
  field,
  labels,
}: {
  error: string | object;
  field: string;
  labels?: Record<string, string | undefined>;
}) => {
  return (
    <>
      <strong className={`${componentName}__error-label`}>
        {getErrorLabel(field, labels)}
      </strong>{" "}
      :{" "}
      <span className={`${componentName}__error-message`}>
        {typeof error === "string" ? error : "Obligatoire"}
      </span>
    </>
  );
};

export const ErrorNotifications = ({
  errors,
  labels,
  visible,
}: ErrorNotificationsProps) => {
  const { cx } = useStyles();
  if (!visible) return null;
  return (
    <Alert
      severity="error"
      title="Veuillez corriger les erreurs suivantes"
      className={cx(componentName, fr.cx("fr-my-2w"))}
      description={
        <ul className={`${componentName}__error-list`}>
          {Object.keys(errors).map((field) => {
            const error = errors[field];
            return (
              <li key={field} className={`${componentName}__error-wrapper`}>
                <ErrorMessage labels={labels} field={field} error={error} />
              </li>
            );
          })}
        </ul>
      }
    />
  );
};
