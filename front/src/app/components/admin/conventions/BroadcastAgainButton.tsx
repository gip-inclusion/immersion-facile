import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { useIsModalOpen } from "@codegouvfr/react-dsfr/Modal/useIsModalOpen";
import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { useDispatch } from "react-redux";
import { ConventionId, zUuidLike } from "shared";
import { Feedback } from "src/app/components/feedback/Feedback";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { apiConsumerSelectors } from "src/core-logic/domain/apiConsumer/apiConsumer.selector";
import { apiConsumerSlice } from "src/core-logic/domain/apiConsumer/apiConsumer.slice";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";
import { conventionSelectors } from "src/core-logic/domain/convention/convention.selectors";
import { conventionSlice } from "src/core-logic/domain/convention/convention.slice";
import { feedbacksSelectors } from "src/core-logic/domain/feedback/feedback.selectors";
import { feedbackSlice } from "src/core-logic/domain/feedback/feedback.slice";

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
  const jwt = useAppSelector(authSelectors.inclusionConnectToken);
  const isLoadingApiConsumer = useAppSelector(apiConsumerSelectors.isLoading);
  const isBroadcasting = useAppSelector(conventionSelectors.isBroadcasting);
  const consumerNames = useAppSelector(apiConsumerSelectors.apiConsumerNames);
  const feedbacks = useAppSelector(feedbacksSelectors.feedbacks);
  const hasErrorFeedback =
    feedbacks["broadcast-convention-again"]?.level === "error";
  const isModalButtonDisabled = disabled ?? false;

  const closeBroadcastFeedbackModal = () => {
    dispatch(feedbackSlice.actions.clearFeedbacksTriggered());
    broadcastAgainModal.close();
  };

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

  useIsModalOpen(broadcastAgainModal, {
    onConceal: () => closeBroadcastFeedbackModal(),
  });

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
          disabled || consumerNames.length === 0 || isLoadingApiConsumer
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
                  conventionSlice.actions.broadcastConventionToPartnerRequested(
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
          Vous allez rediffuser aux SI ou système applicatifs suivant :
          <ul>
            {consumerNames.map((consumerName) => (
              <li key={consumerName}>{consumerName}</li>
            ))}
          </ul>
          <Feedback topic="broadcast-convention-again" />
        </broadcastAgainModal.Component>,
        document.body,
      )}
    </>
  );
};
