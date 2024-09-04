import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useDispatch } from "react-redux";
import { ConventionId, zUuidLike } from "shared";
import { Feedback } from "src/app/components/feedback/Feedback";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { apiConsumerSelectors } from "src/core-logic/domain/apiConsumer/apiConsumer.selector";
import { apiConsumerSlice } from "src/core-logic/domain/apiConsumer/apiConsumer.slice";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";
import { conventionSlice } from "src/core-logic/domain/convention/convention.slice";

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
  const isLoading = useAppSelector(apiConsumerSelectors.isLoading);
  const [isModalButtonDisabled, setIsModalButtonDisabled] = useState(
    disabled ?? false,
  );

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
    setIsModalButtonDisabled(disabled ?? false);
    return () => {
      dispatch(apiConsumerSlice.actions.clearFetchedApiConsumerNames());
    };
  }, [jwt, conventionId, dispatch, disabled]);

  const consumerNames = useAppSelector(apiConsumerSelectors.apiConsumerNames);

  return (
    <>
      <Button
        type="button"
        priority="secondary"
        className={fr.cx("fr-m-1w")}
        onClick={() => {
          broadcastAgainModal.open();
        }}
        disabled={disabled || consumerNames.length === 0 || isLoading}
      >
        Rediffuser dans votre SI ou système applicatif
      </Button>
      {createPortal(
        <broadcastAgainModal.Component title="Rediffuser dans votre SI ou système applicatif">
          Vous allez rediffuser aux SI ou système applicatifs suivant :
          <ul>
            {consumerNames.map((consumerName) => (
              <li key={consumerName}>{consumerName}</li>
            ))}
          </ul>
          <Button
            type="button"
            disabled={isModalButtonDisabled}
            onClick={() => {
              dispatch(
                conventionSlice.actions.broadcastConventionToPartnerRequested({
                  conventionId: conventionId,
                  feedbackTopic: "broadcast-convention-again",
                }),
              );
              setIsModalButtonDisabled(true);
              broadcastAgainModal.close();
            }}
          >
            Rediffuser
          </Button>
        </broadcastAgainModal.Component>,
        document.body,
      )}
      <Feedback topic="broadcast-convention-again" closable={true} />
    </>
  );
};
