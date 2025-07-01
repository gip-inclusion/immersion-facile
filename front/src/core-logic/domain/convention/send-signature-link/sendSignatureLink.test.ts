import { expectObjectsToMatch, expectToEqual } from "shared";
import {
  type SendSignatureLinkState,
  sendSignatureLinkInitialState,
  sendSignatureLinkSlice,
} from "src/core-logic/domain/convention/send-signature-link/sendSignatureLink.slice";
import { feedbacksSelectors } from "src/core-logic/domain/feedback/feedback.selectors";
import {
  createTestStore,
  type TestDependencies,
} from "src/core-logic/storeConfig/createTestStore";
import type { ReduxStore } from "src/core-logic/storeConfig/store";

describe("sendSignatureLink slice", () => {
  let store: ReduxStore;
  let dependencies: TestDependencies;

  beforeEach(() => {
    ({ store, dependencies } = createTestStore({
      sendSignatureLink: {
        ...sendSignatureLinkInitialState,
      },
    }));
  });

  it("sends signature link", () => {
    store.dispatch(
      sendSignatureLinkSlice.actions.sendSignatureLinkRequested({
        conventionId: "fake-covention-id",
        signatoryRole: "beneficiary",
        jwt: "fake-jwt",
        feedbackTopic: "send-signature-link",
      }),
    );
    expectSendSignatureLinkState({
      isSending: true,
    });
    feedGatewaySendSignatureLinkSuccess();

    expectSendSignatureLinkState({
      isSending: false,
    });

    expectToEqual(
      feedbacksSelectors.feedbacks(store.getState())["send-signature-link"],
      {
        level: "success",
        message:
          "Le destinataire devrait le recevoir dans les prochaines minutes.",
        on: "create",
        title: "Le SMS a bien été envoyé",
      },
    );
  });

  it("gets error message when sending signature link fails", () => {
    store.dispatch(
      sendSignatureLinkSlice.actions.sendSignatureLinkRequested({
        conventionId: "fake-covention-id",
        signatoryRole: "beneficiary",
        jwt: "fake-jwt",
        feedbackTopic: "send-signature-link",
      }),
    );
    expectSendSignatureLinkState({
      isSending: true,
    });
    const errorMessage = "Une erreur est survenue lors de l'envoi du SMS.";
    feedGatewayWithSendSignatureLinkFailure(new Error(errorMessage));
    expectSendSignatureLinkState({
      isSending: false,
    });

    expectToEqual(
      feedbacksSelectors.feedbacks(store.getState())["send-signature-link"],
      {
        level: "error",
        message: errorMessage,
        on: "create",
        title: "Problème lors de l'envoi SMS",
      },
    );
  });

  const expectSendSignatureLinkState = (
    sendSignatureLinkState: Partial<SendSignatureLinkState>,
  ) => {
    expectObjectsToMatch(
      store.getState().sendSignatureLink,
      sendSignatureLinkState,
    );
  };

  const feedGatewaySendSignatureLinkSuccess = () => {
    dependencies.conventionGateway.sendSignatureLinkResult$.next(undefined);
  };

  const feedGatewayWithSendSignatureLinkFailure = (error: Error) => {
    dependencies.conventionGateway.sendSignatureLinkResult$.error(error);
  };
});
