import { fr } from "@codegouvfr/react-dsfr";
import Accordion from "@codegouvfr/react-dsfr/Accordion";
import type { ReactNode } from "react";
import {
  type ConventionStatus,
  getBroadcastFeedbackConventionStatusCategory,
  isFranceTravailBroadcastTemporaryNetworkErrorMessage,
  isFunctionalBroadcastFeedbackError,
  type SubscriberErrorFeedback,
} from "shared";
import {
  broadcastFeedbackErrorMessageMap,
  franceTravailTemporaryNetworkErrorBroadcastFeedback,
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

  const statusCategory =
    getBroadcastFeedbackConventionStatusCategory(conventionStatus);

  if (isFunctionalBroadcastFeedbackError(message)) {
    return (
      <BroadcastErrorDetails
        description={broadcastFeedbackErrorMessageMap[message].description}
        solution={broadcastFeedbackErrorMessageMap[message].solution(
          statusCategory,
        )}
      />
    );
  }

  if (isFranceTravailBroadcastTemporaryNetworkErrorMessage(message)) {
    return (
      <BroadcastErrorDetails
        description={
          franceTravailTemporaryNetworkErrorBroadcastFeedback.description
        }
        solution={franceTravailTemporaryNetworkErrorBroadcastFeedback.solution(
          statusCategory,
        )}
      />
    );
  }

  return (
    <BroadcastErrorDetails
      description="Erreur technique"
      useErreurPrefix={false}
      label="Détail de l'erreur"
      solution={
        <p>
          Immersion Facilitée travaille actuellement à une résolution avec votre
          DSI.
        </p>
      }
    />
  );
};

type BroadcastErrorDetailsProps = {
  description: string;
  solution: NonNullable<ReactNode>;
  label?: string;
  useErreurPrefix?: boolean;
};

const BroadcastErrorDetails = ({
  description,
  solution,
  label = "Détails des solutions possibles",
  useErreurPrefix = true,
}: BroadcastErrorDetailsProps): JSX.Element => (
  <div>
    <strong>
      {useErreurPrefix ? <>Erreur - {description}</> : description}
    </strong>
    <Accordion label={label} className={fr.cx("fr-mt-1w", "fr-mb-3w")}>
      {solution}
    </Accordion>
  </div>
);
