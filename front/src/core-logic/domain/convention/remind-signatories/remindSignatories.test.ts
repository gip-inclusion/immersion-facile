import { expectObjectsToMatch, expectToEqual } from "shared";
import {
  RemindSignatoriesState,
  remindSignatoriesInitialState,
  remindSignatoriesSlice,
} from "src/core-logic/domain/convention/remind-signatories/remindSignatories.slice";
import { feedbacksSelectors } from "src/core-logic/domain/feedback/feedback.selectors";
import {
  TestDependencies,
  createTestStore,
} from "src/core-logic/storeConfig/createTestStore";
import { ReduxStore } from "src/core-logic/storeConfig/store";

describe("RemindSignatories slice", () => {
  let store: ReduxStore;
  let dependencies: TestDependencies;

  beforeEach(() => {
    ({ store, dependencies } = createTestStore({
      remindSignatories: {
        ...remindSignatoriesInitialState,
      },
    }));
  });

  it("sends signtories reminder", () => {
    store.dispatch(
      remindSignatoriesSlice.actions.remindSignatoriesRequested({
        conventionId: "fake-covention-id",
        signatoryRole: "beneficiary",
        jwt: "fake-jwt",
        feedbackTopic: "remind-signatories",
      }),
    );
    expectRemindSignatoriesState({
      isLoading: true,
    });
    feedGatewayRemindSignatoriesSuccess();

    expectRemindSignatoriesState({
      isLoading: false,
    });

    expectToEqual(
      feedbacksSelectors.feedbacks(store.getState())["remind-signatories"],
      {
        level: "success",
        message:
          "Le destinataire devrait le recevoir dans les prochaines minutes.",
        on: "create",
        title: "Le SMS a bien été envoyé",
      },
    );
  });

  it("gets error message when signtories reminder fails", () => {
    store.dispatch(
      remindSignatoriesSlice.actions.remindSignatoriesRequested({
        conventionId: "fake-covention-id",
        signatoryRole: "beneficiary",
        jwt: "fake-jwt",
        feedbackTopic: "remind-signatories",
      }),
    );
    expectRemindSignatoriesState({
      isLoading: true,
    });
    const errorMessage = "Une erreur est survenue lors de l'envoi du SMS.";
    feedGatewayWithRemindSignatoriesFailure(new Error(errorMessage));
    expectRemindSignatoriesState({
      isLoading: false,
    });

    expectToEqual(
      feedbacksSelectors.feedbacks(store.getState())["remind-signatories"],
      {
        level: "error",
        message: errorMessage,
        on: "create",
        title: "Problème lors de l'envoi SMS",
      },
    );
  });

  const expectRemindSignatoriesState = (
    remindSignatoriesState: Partial<RemindSignatoriesState>,
  ) => {
    expectObjectsToMatch(
      store.getState().remindSignatories,
      remindSignatoriesState,
    );
  };

  const feedGatewayRemindSignatoriesSuccess = () => {
    dependencies.conventionGateway.remindSignatoriesResult$.next(undefined);
  };

  const feedGatewayWithRemindSignatoriesFailure = (error: Error) => {
    dependencies.conventionGateway.remindSignatoriesResult$.error(error);
  };
});
