import {
  authExpiredMessage,
  type ConventionSupportedJwt,
  expiredJwtErrorMessage,
  expiredJwtErrorTitle,
} from "shared";
import { ErrorPageContent } from "src/app/pages/error/ErrorPageContent";
import { ContactUsButton } from "src/app/pages/error/front-errors";
import type { FeedbackTopic } from "src/core-logic/domain/feedback/feedback.content";
import { RenewExpiredJwtButton } from "../../components/auth/RenewExpiredJwtButton";

export const ShowConventionErrorOrRenewExpiredJwt = ({
  errorMessage,
  jwt,
}: {
  errorMessage: string;
  jwt: ConventionSupportedJwt;
}) => {
  // un peu fragile, mais j'attends qu'on remette au carré les erreurs front/back. Ca fait un fix rapide (8/12/2022)
  if (!errorMessage.includes(expiredJwtErrorMessage))
    throw new Error(
      `Erreur lors de la récupération de la convention : ${errorMessage}`,
    );

  const feedbackTopic: FeedbackTopic = "renew-expired-jwt-convention";
  const description = authExpiredMessage();
  return (
    <ErrorPageContent
      title={expiredJwtErrorTitle}
      description={description}
      buttons={[
        RenewExpiredJwtButton({
          feedbackTopic: feedbackTopic,
          expiredJwt: jwt,
          originalUrl: window.location.href,
        }),
        ContactUsButton({ errorMessage: description }),
      ]}
      feedbackTopic={feedbackTopic}
    />
  );
};
