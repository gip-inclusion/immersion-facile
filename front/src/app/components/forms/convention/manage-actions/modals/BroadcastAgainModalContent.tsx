import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { type ConventionId, type WithConventionId, zUuidLike } from "shared";
import { Feedback } from "src/app/components/feedback/Feedback";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { useFormModal } from "src/app/utils/createFormModal";
import { apiConsumerSelectors } from "src/core-logic/domain/apiConsumer/apiConsumer.selector";
import { apiConsumerSlice } from "src/core-logic/domain/apiConsumer/apiConsumer.slice";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";

type BroadcastAgainModalContentProps = {
  conventionId: ConventionId;
  onSubmit: (params: WithConventionId) => void;
};

export const BroadcastAgainModalContent = ({
  conventionId,
  onSubmit,
}: BroadcastAgainModalContentProps) => {
  const dispatch = useDispatch();
  const jwt = useAppSelector(authSelectors.connectedUserJwt);
  const { formId } = useFormModal();
  const consumerNames = useAppSelector(apiConsumerSelectors.apiConsumerNames);

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

  const { handleSubmit } = useForm();

  return (
    <form id={formId} onSubmit={handleSubmit(() => onSubmit({ conventionId }))}>
      <p>Vous allez rediffuser au SI ou système applicatif suivant :</p>
      <ul>
        {consumerNames.map((consumerName) => (
          <li key={consumerName}>{consumerName}</li>
        ))}
      </ul>
      <Feedback topics={["broadcast-convention-again"]} />
    </form>
  );
};
