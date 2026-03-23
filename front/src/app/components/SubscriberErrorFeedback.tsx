/** biome-ignore-all lint/complexity/noUselessFragments: <explanation> */
import { fr } from "@codegouvfr/react-dsfr";
import Accordion from "@codegouvfr/react-dsfr/Accordion";
import {
  type ConventionStatus,
  conventionStatusesAllowedForModification,
  isFunctionalBroadcastFeedbackError,
  type SubscriberErrorFeedback,
} from "shared";
import { broadcastFeedbackErrorMessageMap } from "src/app/contents/broadcast-feedback/broadcastFeedback";

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

  const managedError = isFunctionalBroadcastFeedbackError(message) && (
    <div>
      <strong>
        Erreur - {broadcastFeedbackErrorMessageMap[message].description}
      </strong>
      <Accordion
        label="Détails des solutions possibles"
        className={fr.cx("fr-mb-3w", "fr-mt-1w")}
      >
        <>
          {broadcastFeedbackErrorMessageMap[message].solution(
            isConventionValidated,
          )}
        </>
      </Accordion>
    </div>
  );

  return (
    <>
      {managedError}
      {!managedError && (
        <div>
          <strong>Erreur technique</strong>
          <Accordion
            label="Détail de l'erreur"
            className={fr.cx("fr-mb-4w", "fr-mt-1w")}
          >
            <p>
              Nous travaillons actuellement à une proposition de solution avec
              votre DSI, Elle vous sera proposée prochainement.
            </p>
          </Accordion>
        </div>
      )}
    </>
  );
};
