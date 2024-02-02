import {
  TestDependencies,
  createTestStore,
} from "src/core-logic/storeConfig/createTestStore";
import { ReduxStore } from "src/core-logic/storeConfig/store";
import {
  PartnersErroredConventionState,
  partnersErroredConventionSlice,
} from "./partnersErroredConvention.slice";

describe("Agency info in store", () => {
  let store: ReduxStore;
  let dependencies: TestDependencies;
  const fakeConventionId = "add5c20e-6dd2-45af-affe-927358005251";
  beforeEach(() => {
    ({ store, dependencies } = createTestStore());
  });

  it("should switch isLoading to true when mark as handled is requested", () => {
    store.dispatch(
      partnersErroredConventionSlice.actions.markAsHandledRequested({
        jwt: "my-jwt",
        markAsHandledParams: { conventionId: fakeConventionId },
      }),
    );
    expectIsLoadingToBe(true);
  });

  it("should set feedbackKind as mark as handled when mark as handled succesfull", () => {
    const expectedFeedback: PartnersErroredConventionState["feedback"] = {
      kind: "markedAsHandled",
    };

    store.dispatch(
      partnersErroredConventionSlice.actions.markAsHandledRequested({
        jwt: "my-jwt",
        markAsHandledParams: { conventionId: fakeConventionId },
      }),
    );
    dependencies.inclusionConnectedGateway.markPartnersErroredConventionAsHandledResult$.next();

    expectIsLoadingToBe(false);
    expectFeedbackToEqual(expectedFeedback);
  });

  it("should throw an error when something goes wrong", () => {
    const errorMessage = "Error trying to mark error convention as handled";
    const expectedFeedback: PartnersErroredConventionState["feedback"] = {
      kind: "errored",
      errorMessage,
    };
    store.dispatch(
      partnersErroredConventionSlice.actions.markAsHandledRequested({
        jwt: "my-jwt",
        markAsHandledParams: { conventionId: fakeConventionId },
      }),
    );

    dependencies.inclusionConnectedGateway.markPartnersErroredConventionAsHandledResult$.error(
      new Error(errorMessage),
    );

    expectIsLoadingToBe(false);
    expectFeedbackToEqual(expectedFeedback);
  });

  const expectIsLoadingToBe = (
    expected: PartnersErroredConventionState["isLoading"],
  ) =>
    expect(store.getState().partnersErroredConvention.isLoading).toBe(expected);

  const expectFeedbackToEqual = (
    expected: PartnersErroredConventionState["feedback"],
  ) =>
    expect(store.getState().partnersErroredConvention.feedback).toEqual(
      expected,
    );
});
