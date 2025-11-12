import {
  type ConventionStatus,
  conventionStatusesAllowedForModification,
  type SubscriberErrorFeedback,
} from "shared";
import {
  broadcastFeedbackErrorMap,
  isManagedBroadcastFeedbackError,
} from "src/app/contents/broadcast-feedback/broadcastFeedback";

interface SubscriberErrorFeedbackProps {
  subscriberErrorFeedback: SubscriberErrorFeedback;
  conventionStatus: ConventionStatus;
}

export const SubscriberErrorFeedbackComponent = ({
  subscriberErrorFeedback,
  conventionStatus,
}: SubscriberErrorFeedbackProps): JSX.Element => {
  const { message } = subscriberErrorFeedback;

  const isConventionValidated =
    !conventionStatusesAllowedForModification.includes(conventionStatus);

  const managedError = isManagedBroadcastFeedbackError(message) && (
    <div>
      <p>Erreur - {broadcastFeedbackErrorMap[message].description}</p>
      {broadcastFeedbackErrorMap[message].solution(isConventionValidated)}
    </div>
  );

  return (
    <>
      {managedError}
      {!managedError && (
        <div>
          <p>Une erreur technique s'est produite.</p>
          <p>Voici le détail :</p>
          <p>{message}</p>
        </div>
      )}
    </>
  );
};
