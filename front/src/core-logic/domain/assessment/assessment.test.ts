import { expectToEqual } from "shared";
import {
  createTestStore,
  TestDependencies,
} from "src/core-logic/storeConfig/createTestStore";
import { ReduxStore } from "src/core-logic/storeConfig/store";
import {
  assessmentErrorSelector,
  assessmentStatusSelector,
} from "./assessment.selectors";
import { assessmentSlice, AssessmentUIStatus } from "./assessment.slice";

describe("Immersion Assessment slice", () => {
  let store: ReduxStore;
  let dependencies: TestDependencies;

  beforeEach(() => {
    ({ store, dependencies } = createTestStore());
  });

  it("immersion assessment creation requested - success", () => {
    expectStatusToBe("Idle");
    store.dispatch(
      assessmentSlice.actions.creationRequested({
        assessment: {
          conventionId: "23465",
          status: "ABANDONED",
          establishmentFeedback: "my feedback",
        },
        jwt: "",
      }),
    );
    expectStatusToBe("Loading");
    feedGatewayWithCreationSuccess();
    expectStatusToBe("Success");
    expectErrorToBe(null);
  });

  it("immersion assessment creation requested - error on backend", () => {
    const backendError: Error = new Error("Backend Error");
    expectStatusToBe("Idle");
    store.dispatch(
      assessmentSlice.actions.creationRequested({
        assessment: {
          conventionId: "23465",
          status: "ABANDONED",
          establishmentFeedback: "my feedback",
        },
        jwt: "",
      }),
    );
    expectStatusToBe("Loading");
    feedGatewayWithCreationError(backendError);
    expectStatusToBe("Idle");
    expectErrorToBe(backendError.message);
  });

  const expectStatusToBe = (assessmentStatus: AssessmentUIStatus) => {
    expectToEqual(assessmentStatusSelector(store.getState()), assessmentStatus);
  };

  const expectErrorToBe = (expectedErrorMessage: string | null) => {
    expectToEqual(
      assessmentErrorSelector(store.getState()),
      expectedErrorMessage,
    );
  };

  const feedGatewayWithCreationError = (error: Error) => {
    dependencies.assessmentGateway.creationResponse$.error(error);
  };

  const feedGatewayWithCreationSuccess = () => {
    dependencies.assessmentGateway.creationResponse$.next(undefined);
  };
});
