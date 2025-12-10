/** biome-ignore-all lint/complexity/noUselessFragments: <explanation> */
import { fr } from "@codegouvfr/react-dsfr";
import Accordion from "@codegouvfr/react-dsfr/Accordion";
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
      <strong>Erreur - {broadcastFeedbackErrorMap[message].description}</strong>
      <Accordion
        label="Détail de l'erreur"
        className={fr.cx("fr-mb-3w", "fr-mt-1w")}
      >
        <>
          {broadcastFeedbackErrorMap[message].solution(isConventionValidated)}
        </>
      </Accordion>
    </div>
  );

  return (
    <>
      {managedError}
      {!managedError && (
        <div>
          <strong>
            Une erreur technique s'est produite. Veuillez contacter votre DSI
            pour la corriger.
          </strong>
          <Accordion
            label="Détail de l'erreur"
            className={fr.cx("fr-mb-4w", "fr-mt-1w")}
          >
            <p>{message}</p>
          </Accordion>
        </div>
      )}
    </>
  );
};
