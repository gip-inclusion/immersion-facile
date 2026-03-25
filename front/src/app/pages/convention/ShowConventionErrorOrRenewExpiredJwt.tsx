import { type ConventionSupportedJwt, expiredJwtErrorMessage } from "shared";
import { frontErrors } from "src/app/pages/error/front-errors";
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

  throw frontErrors.jwtLink.expired({
    RenewJwtButton: (
      <RenewExpiredJwtButton
        key={RenewExpiredJwtButton.name}
        expiredJwt={jwt}
        feedbackTopic={feedbackTopic}
        originalUrl={window.location.href}
      />
    ),
  });
};
