import { expectObjectsToMatch, expectToEqual } from "shared";
import {
  type SendAssessmentLinkState,
  sendAssessmentLinkInitialState,
  sendAssessmentLinkSlice,
} from "src/core-logic/domain/assessment/send-assessment-link/sendAssessmentLink.slice";
import { feedbacksSelectors } from "src/core-logic/domain/feedback/feedback.selectors";
import {
  createTestStore,
  type TestDependencies,
} from "src/core-logic/storeConfig/createTestStore";
import type { ReduxStore } from "src/core-logic/storeConfig/store";

describe("sendAssessmentLink slice", () => {
  let store: ReduxStore;
  let dependencies: TestDependencies;

  beforeEach(() => {
    ({ store, dependencies } = createTestStore({
      sendAssessmentLink: {
        ...sendAssessmentLinkInitialState,
      },
    }));
  });

  it("sends assessment link", () => {
    store.dispatch(
      sendAssessmentLinkSlice.actions.sendAssessmentLinkRequested({
        conventionId: "fake-covention-id",
        jwt: "fake-jwt",
        feedbackTopic: "send-assessment-link",
      }),
    );
    expectSendAssessmentLinkState({
      isSending: true,
    });
    feedGatewaySendAssessmentLinkSuccess();

    expectSendAssessmentLinkState({
      isSending: false,
    });

    expectToEqual(
      feedbacksSelectors.feedbacks(store.getState())["send-assessment-link"],
      {
        level: "success",
        message:
          "Le destinataire devrait le recevoir dans les prochaines minutes.",
        on: "create",
        title: "Le SMS a bien été envoyé",
      },
    );
  });

  it("gets error message when sending assessment link fails", () => {
    store.dispatch(
      sendAssessmentLinkSlice.actions.sendAssessmentLinkRequested({
        conventionId: "fake-covention-id",
        jwt: "fake-jwt",
        feedbackTopic: "send-assessment-link",
      }),
    );
    expectSendAssessmentLinkState({
      isSending: true,
    });
    const errorMessage = "Une erreur est survenue lors de l'envoi du SMS.";
    feedGatewayWithSendAssessmentLinkFailure(new Error(errorMessage));
    expectSendAssessmentLinkState({
      isSending: false,
    });

    expectToEqual(
      feedbacksSelectors.feedbacks(store.getState())["send-assessment-link"],
      {
        level: "error",
        message: errorMessage,
        on: "create",
        title: "Problème lors de l'envoi SMS",
      },
    );
  });

  const expectSendAssessmentLinkState = (
    sendAssessmentLinkState: Partial<SendAssessmentLinkState>,
  ) => {
    expectObjectsToMatch(
      store.getState().sendAssessmentLink,
      sendAssessmentLinkState,
    );
  };

  const feedGatewaySendAssessmentLinkSuccess = () => {
    dependencies.assessmentGateway.sendAssessmentLinkResponse$.next(undefined);
  };

  const feedGatewayWithSendAssessmentLinkFailure = (error: Error) => {
    dependencies.assessmentGateway.sendAssessmentLinkResponse$.error(error);
  };
});
