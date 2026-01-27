import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { useIsModalOpen } from "@codegouvfr/react-dsfr/Modal/useIsModalOpen";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useDispatch } from "react-redux";
import { type ConventionId, zUuidLike } from "shared";
import { Feedback } from "src/app/components/feedback/Feedback";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { apiConsumerSelectors } from "src/core-logic/domain/apiConsumer/apiConsumer.selector";
import { apiConsumerSlice } from "src/core-logic/domain/apiConsumer/apiConsumer.slice";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";
import { conventionActionSelectors } from "src/core-logic/domain/convention/convention-action/conventionAction.selectors";
import { conventionActionSlice } from "src/core-logic/domain/convention/convention-action/conventionAction.slice";
import { feedbacksSelectors } from "src/core-logic/domain/feedback/feedback.selectors";

const broadcastAgainModal = createModal({
  isOpenedByDefault: false,
  id: "im-broadcast-modal",
});

export const BroadcastAgainButton = ({
  conventionId,
  disabled,
}: {
  conventionId: ConventionId;
  disabled?: boolean;
}) => {
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
  const isConventionValidated =
    feedbacks["convention-action-accept-by-validator"]?.level === "success" &&
    feedbacks["convention-action-accept-by-validator"].on === "update";
  const isModalButtonDisabled = disabled ?? false;

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

  useIsModalOpen(broadcastAgainModal);

  return (
    <>
      <Button
        type="button"
        priority="secondary"
        className={fr.cx("fr-m-1w")}
        onClick={() => {
          broadcastAgainModal.open();
        }}
        disabled={
          disabled ||
          consumerNames.length === 0 ||
          isLoadingApiConsumer ||
          isConventionValidated
        }
      >
        Rediffuser dans votre SI ou système applicatif
      </Button>
      {createPortal(
        <broadcastAgainModal.Component
          title="Rediffuser dans votre SI ou système applicatif"
          buttons={[
            {
              doClosesModal: true,
              children: "Fermer",
            },
            {
              doClosesModal: false,
              children: "Rediffuser",
              disabled:
                isModalButtonDisabled || isBroadcasting || hasErrorFeedback,
              onClick: () => {
                dispatch(
                  conventionActionSlice.actions.broadcastConventionToPartnerRequested(
                    {
                      conventionId: conventionId,
                      feedbackTopic: "broadcast-convention-again",
                    },
                  ),
                );
              },
            },
          ]}
        >
          Vous allez rediffuser au SI ou système applicatif suivant :
          <ul>
            {consumerNames.map((consumerName) => (
              <li key={consumerName}>{consumerName}</li>
            ))}
          </ul>
          <Feedback topics={["broadcast-convention-again"]} />
        </broadcastAgainModal.Component>,
        document.body,
      )}
    </>
  );
};
