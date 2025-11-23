import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { type ConventionId, type WithConventionId, zUuidLike } from "shared";
import { Feedback } from "src/app/components/feedback/Feedback";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { apiConsumerSelectors } from "src/core-logic/domain/apiConsumer/apiConsumer.selector";
import { apiConsumerSlice } from "src/core-logic/domain/apiConsumer/apiConsumer.slice";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";
import { conventionActionSelectors } from "src/core-logic/domain/convention/convention-action/conventionAction.selectors";
import { feedbacksSelectors } from "src/core-logic/domain/feedback/feedback.selectors";

type BroadcastAgainModalContentProps = {
  conventionId: ConventionId;
  closeModal: () => void;
  onSubmit: (params: WithConventionId) => void;
};

export const BroadcastAgainModalContent = ({
  conventionId,
  closeModal,
  onSubmit,
}: BroadcastAgainModalContentProps) => {
  const dispatch = useDispatch();
  const jwt = useAppSelector(authSelectors.connectedUserJwt);
  const isLoadingApiConsumer = useAppSelector(apiConsumerSelectors.isLoading);
  const isBroadcasting = useAppSelector(
    conventionActionSelectors.isBroadcasting,
  );
  const consumerNames = useAppSelector(apiConsumerSelectors.apiConsumerNames);
  const feedbacks = useAppSelector(feedbacksSelectors.feedbacks);
  const hasErrorFeedback =
    feedbacks["broadcast-convention-again"]?.level === "error";

  useEffect(() => {
    jwt &&
      zUuidLike.safeParse(conventionId).success &&
      dispatch(
        apiConsumerSlice.actions.fetchApiConsumerNamesRequested({
          conventionId,
          jwt: jwt,
          feedbackTopic: "api-consumer-names",
        }),
      );
    return () => {
      dispatch(apiConsumerSlice.actions.clearFetchedApiConsumerNames());
    };
  }, [jwt, conventionId, dispatch]);

  return (
    <>
      <p>Vous allez rediffuser aux SI ou système applicatifs suivant :</p>
      <ul>
        {consumerNames.map((consumerName) => (
          <li key={consumerName}>{consumerName}</li>
        ))}
      </ul>
      <Feedback topics={["broadcast-convention-again"]} />
      <div
        style={{
          display: "flex",
          gap: "1rem",
          justifyContent: "flex-end",
          marginTop: "1rem",
        }}
      >
        <button
          type="button"
          onClick={closeModal}
          className="fr-btn fr-btn--secondary"
        >
          Fermer
        </button>
        <button
          type="button"
          onClick={() => {
            onSubmit({ conventionId });
          }}
          disabled={
            isBroadcasting ||
            hasErrorFeedback ||
            isLoadingApiConsumer ||
            consumerNames.length === 0
          }
          className="fr-btn fr-btn--primary"
        >
          Rediffuser
        </button>
      </div>
    </>
  );
};
