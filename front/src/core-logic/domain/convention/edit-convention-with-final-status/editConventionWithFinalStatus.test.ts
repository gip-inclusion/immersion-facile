import {
  type EditConventionWithFinalStatusRequestDto,
  expectObjectsToMatch,
  expectToEqual,
} from "shared";
import {
  type EditConventionWithFinalStatusState,
  editConventionWithFinalStatusInitialState,
  editConventionWithFinalStatusSlice,
} from "src/core-logic/domain/convention/edit-convention-with-final-status/editConventionWithFinalStatus.slice";
import { feedbacksSelectors } from "src/core-logic/domain/feedback/feedback.selectors";
import {
  createTestStore,
  type TestDependencies,
} from "src/core-logic/storeConfig/createTestStore";
import type { ReduxStore } from "src/core-logic/storeConfig/store";

describe("editConventionWithFinalStatus slice", () => {
  let store: ReduxStore;
  let dependencies: TestDependencies;

  const basePayload: EditConventionWithFinalStatusRequestDto = {
    conventionId: "fake-convention-id",
    updatedBeneficiaryBirthDate: "1995-03-15",
    firstname: "Jean",
    lastname: "Martin",
  };

  beforeEach(() => {
    ({ store, dependencies } = createTestStore({
      editConventionWithFinalStatus: {
        ...editConventionWithFinalStatusInitialState,
      },
    }));
  });

  it("edits convention with final status", () => {
    store.dispatch(
      editConventionWithFinalStatusSlice.actions.editConventionWithFinalStatusRequested(
        {
          ...basePayload,
          jwt: "fake-jwt",
          feedbackTopic: "edit-convention-with-final-status",
        },
      ),
    );
    expectEditConventionWithFinalStatusState({
      isLoading: true,
    });
    feedGatewayEditConventionWithFinalStatusSuccess();

    expectEditConventionWithFinalStatusState({
      isLoading: false,
    });

    expectToEqual(
      feedbacksSelectors.feedbacks(store.getState())[
        "edit-convention-with-final-status"
      ],
      {
        level: "success",
        message: "La convention a bien été modifiée",
        on: "update",
        title: "La convention a bien été modifiée",
      },
    );
  });

  it("gets error message when edit fails", () => {
    store.dispatch(
      editConventionWithFinalStatusSlice.actions.editConventionWithFinalStatusRequested(
        {
          ...basePayload,
          jwt: "fake-jwt",
          feedbackTopic: "edit-convention-with-final-status",
        },
      ),
    );
    expectEditConventionWithFinalStatusState({
      isLoading: true,
    });
    const errorMessage =
      "Une erreur est survenue lors de la modification de la convention.";
    feedGatewayWithEditConventionWithFinalStatusFailure(
      new Error(errorMessage),
    );
    expectEditConventionWithFinalStatusState({
      isLoading: false,
    });

    expectToEqual(
      feedbacksSelectors.feedbacks(store.getState())[
        "edit-convention-with-final-status"
      ],
      {
        level: "error",
        message: errorMessage,
        on: "update",
        title: "Problème lors de la modification de la convention",
      },
    );
  });

  const expectEditConventionWithFinalStatusState = (
    editConventionWithFinalStatusState: Partial<EditConventionWithFinalStatusState>,
  ) => {
    expectObjectsToMatch(
      store.getState().editConventionWithFinalStatus,
      editConventionWithFinalStatusState,
    );
  };

  const feedGatewayEditConventionWithFinalStatusSuccess = () => {
    dependencies.conventionGateway.editConventionWithFinalStatusResult$.next(
      undefined,
    );
  };

  const feedGatewayWithEditConventionWithFinalStatusFailure = (
    error: Error,
  ) => {
    dependencies.conventionGateway.editConventionWithFinalStatusResult$.error(
      error,
    );
  };
});
