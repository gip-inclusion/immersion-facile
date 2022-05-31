import { expectObjectToMatch } from "shared/src/expectToEqual";
import {
  createTestStore,
  TestDependencies,
} from "src/core-logic/storeConfig/createTestStore";
import { ReduxStore } from "src/core-logic/storeConfig/store";
import {
  immersionAssessmentSlice,
  ImmersionAssessmentState,
} from "./immersionAssessment.slice";

describe("Immersion Assessment slice", () => {
  let store: ReduxStore;
  let dependencies: TestDependencies;

  beforeEach(() => {
    ({ store, dependencies } = createTestStore());
  });

  it("immersion assessment creation requested - success", () => {
    expectImmersionAssessmentStateToMatch({ isLoading: false, error: null });
    store.dispatch(
      immersionAssessmentSlice.actions.creationRequested({
        conventionId: "23465",
        status: "ABANDONED",
        establishmentFeedback: "my feedback",
      }),
    );
    expectImmersionAssessmentStateToMatch({ isLoading: true });
    feedGatewayWithCreationSuccess();
    expectImmersionAssessmentStateToMatch({ isLoading: false, error: null });
  });

  it("immersion assessment creation requested - error on backend", () => {
    const backendError: Error = new Error("Backend Error");
    expectImmersionAssessmentStateToMatch({ isLoading: false, error: null });
    store.dispatch(
      immersionAssessmentSlice.actions.creationRequested({
        conventionId: "23465",
        status: "ABANDONED",
        establishmentFeedback: "my feedback",
      }),
    );
    expectImmersionAssessmentStateToMatch({ isLoading: true });
    feedGatewayWithCreationError(backendError);
    expectImmersionAssessmentStateToMatch({
      isLoading: false,
      error: backendError.message,
    });
  });

  const expectImmersionAssessmentStateToMatch = (
    immersionAssessmentState: Partial<ImmersionAssessmentState>,
  ) => {
    expectObjectToMatch(
      store.getState().immersionAssessment,
      immersionAssessmentState,
    );
  };

  const feedGatewayWithCreationError = (error: Error) => {
    dependencies.immersionAssessmentGateway.creationResponse$.error(error);
  };

  const feedGatewayWithCreationSuccess = () => {
    dependencies.immersionAssessmentGateway.creationResponse$.next(undefined);
  };
});
