import { expectToEqual } from "shared";
import { feedbacksSelectors } from "src/core-logic/domain/feedback/feedback.selectors";
import {
  TestDependencies,
  createTestStore,
} from "src/core-logic/storeConfig/createTestStore";
import { ReduxStore } from "src/core-logic/storeConfig/store";
import { assessmentSelectors } from "./assessment.selectors";
import { assessmentSlice } from "./assessment.slice";

describe("Immersion Assessment slice", () => {
  let store: ReduxStore;
  let dependencies: TestDependencies;

  beforeEach(() => {
    ({ store, dependencies } = createTestStore());
  });

  it("immersion assessment creation requested - success", () => {
    expectStateToMatchInitialState(store);
    store.dispatch(
      assessmentSlice.actions.creationRequested({
        assessmentAndJwt: {
          assessment: {
            conventionId: "23465",
            status: "DID_NOT_SHOW",
            endedWithAJob: false,
            establishmentFeedback: "my feedback",
            establishmentAdvices: "my advices",
          },
          jwt: "",
        },
        feedbackTopic: "assessment",
      }),
    );
    expect(assessmentSelectors.isLoading(store.getState())).toBe(true);
    feedGatewayWithCreationSuccess();
    expect(assessmentSelectors.isLoading(store.getState())).toBe(false);
    expectToEqual(feedbacksSelectors.feedbacks(store.getState()), {
      assessment: {
        title: "Bilan envoyé",
        level: "success",
        on: "create",
        message: "Le bilan a bien été envoyé",
      },
    });
  });

  it("immersion assessment creation requested - error on backend", () => {
    const backendError: Error = new Error("Backend Error");
    expectStateToMatchInitialState(store);
    store.dispatch(
      assessmentSlice.actions.creationRequested({
        assessmentAndJwt: {
          assessment: {
            conventionId: "23465",
            status: "DID_NOT_SHOW",
            endedWithAJob: false,
            establishmentFeedback: "my feedback",
            establishmentAdvices: "my advices",
          },
          jwt: "",
        },
        feedbackTopic: "assessment",
      }),
    );
    expect(assessmentSelectors.isLoading(store.getState())).toBe(true);
    feedGatewayWithCreationError(backendError);
    expect(assessmentSelectors.isLoading(store.getState())).toBe(false);
    expectToEqual(feedbacksSelectors.feedbacks(store.getState()), {
      assessment: {
        title: "Problème lors de l'envoi du bilan",
        level: "error",
        on: "create",
        message: "Backend Error",
      },
    });
  });

  const feedGatewayWithCreationError = (error: Error) => {
    dependencies.assessmentGateway.creationResponse$.error(error);
  };

  const feedGatewayWithCreationSuccess = () => {
    dependencies.assessmentGateway.creationResponse$.next(undefined);
  };
});

const expectStateToMatchInitialState = (store: ReduxStore) => {
  expectToEqual(assessmentSelectors.isLoading(store.getState()), false);
  expectToEqual(assessmentSelectors.currentAssessment(store.getState()), null);
};
