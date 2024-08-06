import { expectToEqual } from "shared";
import {
  TestDependencies,
  createTestStore,
} from "src/core-logic/storeConfig/createTestStore";
import { ReduxStore } from "src/core-logic/storeConfig/store";
import { feedbacksSelectors } from "../feedback/feedback.selectors";
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
        feedbackTopic: "partner-conventions",
      }),
    );
    expectIsLoadingToBe(true);
  });

  it("should set feedbackKind as mark as handled when mark as handled succesfull", () => {
    store.dispatch(
      partnersErroredConventionSlice.actions.markAsHandledRequested({
        jwt: "my-jwt",
        markAsHandledParams: { conventionId: fakeConventionId },
        feedbackTopic: "partner-conventions",
      }),
    );
    dependencies.inclusionConnectedGateway.markPartnersErroredConventionAsHandledResult$.next();

    expectIsLoadingToBe(false);
    expectToEqual(feedbacksSelectors.feedbacks(store.getState()), {
      "partner-conventions": {
        on: "update",
        level: "success",
        title: "La convention a bien été marquée comme traitée",
        message: "La convention a bien été marquée comme traitée.",
      },
    });
  });

  it("should throw an error when something goes wrong", () => {
    const errorMessage = "Error trying to mark error convention as handled";
    store.dispatch(
      partnersErroredConventionSlice.actions.markAsHandledRequested({
        jwt: "my-jwt",
        markAsHandledParams: { conventionId: fakeConventionId },
        feedbackTopic: "partner-conventions",
      }),
    );

    dependencies.inclusionConnectedGateway.markPartnersErroredConventionAsHandledResult$.error(
      new Error(errorMessage),
    );

    expectIsLoadingToBe(false);
    expectToEqual(feedbacksSelectors.feedbacks(store.getState()), {
      "partner-conventions": {
        on: "update",
        level: "error",
        title: "Problème rencontré",
        message: errorMessage,
      },
    });
  });

  const expectIsLoadingToBe = (
    expected: PartnersErroredConventionState["isLoading"],
  ) =>
    expect(store.getState().partnersErroredConvention.isLoading).toBe(expected);
});
