import { type AssessmentDto, errors, expectToEqual } from "shared";
import { feedbacksSelectors } from "src/core-logic/domain/feedback/feedback.selectors";
import {
  createTestStore,
  type TestDependencies,
} from "src/core-logic/storeConfig/createTestStore";
import type { ReduxStore } from "src/core-logic/storeConfig/store";
import { assessmentSelectors } from "./assessment.selectors";
import { assessmentSlice } from "./assessment.slice";

describe("Immersion Assessment slice", () => {
  let store: ReduxStore;
  let dependencies: TestDependencies;

  beforeEach(() => {
    ({ store, dependencies } = createTestStore());
  });

  describe("immersion assessment creation requested", () => {
    const feedGatewayWithCreationError = (error: Error) => {
      dependencies.assessmentGateway.creationResponse$.error(error);
    };

    const feedGatewayWithCreationSuccess = () => {
      dependencies.assessmentGateway.creationResponse$.next(undefined);
    };

    it("success", () => {
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

    it("error on backend", () => {
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
  });

  describe("immersion assessment get requested", () => {
    const conventionId = "11111111-1111-4111-1111-111111111111";
    const assessment: AssessmentDto = {
      conventionId,
      status: "COMPLETED",
      endedWithAJob: false,
      establishmentAdvices: "my advices",
      establishmentFeedback: "my feedback",
    };
    const feedGatewayWithGetError = (error: Error) => {
      dependencies.assessmentGateway.getResponse$.error(error);
    };

    const feedGatewayWithGetSuccess = () => {
      dependencies.assessmentGateway.getResponse$.next(assessment);
    };

    it("success", () => {
      expectStateToMatchInitialState(store);

      store.dispatch(
        assessmentSlice.actions.getAssessmentRequested({
          conventionId,
          jwt: "my-jwt",
          feedbackTopic: "assessment",
        }),
      );

      expect(assessmentSelectors.isLoading(store.getState())).toBe(true);
      feedGatewayWithGetSuccess();
      expect(assessmentSelectors.isLoading(store.getState())).toBe(false);
    });

    it("not found error", () => {
      expectStateToMatchInitialState(store);
      store.dispatch(
        assessmentSlice.actions.getAssessmentRequested({
          conventionId,
          jwt: "my-jwt",
          feedbackTopic: "assessment",
        }),
      );

      expect(assessmentSelectors.isLoading(store.getState())).toBe(true);
      feedGatewayWithGetError(errors.assessment.notFound(conventionId));
      expect(assessmentSelectors.isLoading(store.getState())).toBe(false);
      expectToEqual(feedbacksSelectors.feedbacks(store.getState()), {});
    });

    it("other errors", () => {
      expectStateToMatchInitialState(store);
      store.dispatch(
        assessmentSlice.actions.getAssessmentRequested({
          conventionId,
          jwt: "my-jwt",
          feedbackTopic: "assessment",
        }),
      );

      expect(assessmentSelectors.isLoading(store.getState())).toBe(true);
      feedGatewayWithGetError(new Error("Assessement not found"));
      expect(assessmentSelectors.isLoading(store.getState())).toBe(false);
      expectToEqual(feedbacksSelectors.feedbacks(store.getState()), {
        assessment: {
          title: "Problème lors de la récupération du bilan",
          level: "error",
          on: "fetch",
          message: "Assessement not found",
        },
      });
    });
  });

  describe("immersion assessment delete requested", () => {
    const feedGatewayWithDeleteError = (error: Error) => {
      dependencies.assessmentGateway.deleteAssessmentResponse$.error(error);
    };

    const feedGatewayWithDeleteSuccess = () => {
      dependencies.assessmentGateway.deleteAssessmentResponse$.next(undefined);
    };

    it("success", () => {
      expectStateToMatchInitialState(store);
      store.dispatch(
        assessmentSlice.actions.deleteAssessmentRequested({
          params: {
            conventionId: "23465",
            deleteAssessmentJustification: "Parce que…",
          },
          jwt: "my-jwt",
          feedbackTopic: "delete-assessment",
        }),
      );
      expect(assessmentSelectors.isLoading(store.getState())).toBe(true);
      feedGatewayWithDeleteSuccess();
      expect(assessmentSelectors.isLoading(store.getState())).toBe(false);
      expectToEqual(feedbacksSelectors.feedbacks(store.getState()), {
        "delete-assessment": {
          title: "Bilan supprimé",
          level: "success",
          on: "delete",
          message: "Le bilan a bien été supprimé",
        },
      });
    });

    it("error on backend", () => {
      const backendError: Error = new Error("Backend Error");
      expectStateToMatchInitialState(store);
      store.dispatch(
        assessmentSlice.actions.deleteAssessmentRequested({
          params: {
            conventionId: "23465  ",
            deleteAssessmentJustification: "Parce que…",
          },
          jwt: "my-jwt",
          feedbackTopic: "delete-assessment",
        }),
      );
      expect(assessmentSelectors.isLoading(store.getState())).toBe(true);
      feedGatewayWithDeleteError(backendError);
      expect(assessmentSelectors.isLoading(store.getState())).toBe(false);
      expectToEqual(feedbacksSelectors.feedbacks(store.getState()), {
        "delete-assessment": {
          title: "Problème lors de la suppression du bilan",
          level: "error",
          on: "delete",
          message: "Backend Error",
        },
      });
    });
  });

  describe("clear fetched assessment", () => {
    it("Clear fetched assessment", () => {
      const conventionId = "11111111-1111-4111-1111-111111111111";
      const assessment: AssessmentDto = {
        conventionId,
        status: "COMPLETED",
        endedWithAJob: false,
        establishmentAdvices: "my advices",
        establishmentFeedback: "my feedback",
      };
      ({ store } = createTestStore({
        assessment: {
          isLoading: false,
          currentAssessment: assessment,
        },
      }));

      expectToEqual(
        assessmentSelectors.currentAssessment(store.getState()),
        assessment,
      );

      store.dispatch(assessmentSlice.actions.clearFetchedAssessment());
      expectStateToMatchInitialState(store);
      expectToEqual(
        assessmentSelectors.currentAssessment(store.getState()),
        null,
      );
    });
  });
});

const expectStateToMatchInitialState = (store: ReduxStore) => {
  expectToEqual(assessmentSelectors.isLoading(store.getState()), false);
  expectToEqual(assessmentSelectors.currentAssessment(store.getState()), null);
};
