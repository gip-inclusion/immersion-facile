import React from "react";
import { Notification } from "react-design-system/immersionFacile";

export type SubmitFeedBackKind<T> = T | Error | null;

export type SubmitFeedbackProps<T extends string> = {
  submitFeedback: SubmitFeedBackKind<T>;
  messageByKind: Record<T, React.ReactNode>;
};

export const SubmitFeedback = <T extends string>({
  submitFeedback,
  messageByKind,
}: SubmitFeedbackProps<T>) => {
  if (submitFeedback === null) return null;

  return (
    <>
      {submitFeedback instanceof Error ? (
        <Notification
          type="error"
          title="Désolé : nous n'avons pas été en mesure d'enregistrer vos informations. Veuillez réessayer ultérieurement"
        >
          {getErrorMessage(submitFeedback)}
        </Notification>
      ) : (
        <Notification type="success" title="Succès de l'envoi">
          {messageByKind[submitFeedback]}
        </Notification>
      )}
    </>
  );
};

const getErrorMessage = (submitError: Error) =>
  (submitError as any)?.response?.data?.errors ?? submitError?.message;
