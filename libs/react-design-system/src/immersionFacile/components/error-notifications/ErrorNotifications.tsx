import React from "react";
import { Notification } from "../notification";

const componentName = "im-notification-errors";

type ErrorNotificationsProps = {
  labels?: Record<string, string | undefined>;
  errors: Record<string, string>;
  visible: boolean;
};

const ErrorMessage = ({
  labels,
  field,
  error,
}: {
  labels?: Record<string, string | undefined>;
  field: string;
  error: string | object;
}) => (
  <>
    <strong className={`${componentName}__error-label`}>
      {labels && labels[field] ? labels[field] : field}
    </strong>{" "}
    :{" "}
    <span className={`${componentName}__error-message`}>
      {typeof error === "string" ? error : "Obligatoire"}
    </span>
  </>
);

export const ErrorNotifications = ({
  labels,
  errors,
  visible,
}: ErrorNotificationsProps) => {
  if (!visible) return null;
  return (
    <Notification
      type="error"
      title="Veuillez corriger les erreurs suivantes"
      className={`${componentName}`}
    >
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
    </Notification>
  );
};
