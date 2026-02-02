import { expectObjectsToMatch, expectToEqual } from "shared";
import {
  type EditBeneficiaryBirthdateState,
  editBeneficiaryBirthdateInitialState,
  editBeneficiaryBirthdateSlice,
} from "src/core-logic/domain/convention/edit-beneficiary-birthdate/editBeneficiaryBirthdate.slice";
import { feedbacksSelectors } from "src/core-logic/domain/feedback/feedback.selectors";
import {
  createTestStore,
  type TestDependencies,
} from "src/core-logic/storeConfig/createTestStore";
import type { ReduxStore } from "src/core-logic/storeConfig/store";

describe("editBeneficiaryBirthdate slice", () => {
  let store: ReduxStore;
  let dependencies: TestDependencies;

  beforeEach(() => {
    ({ store, dependencies } = createTestStore({
      editBeneficiaryBirthdate: {
        ...editBeneficiaryBirthdateInitialState,
      },
    }));
  });

  it("edits beneficiary birthdate", () => {
    store.dispatch(
      editBeneficiaryBirthdateSlice.actions.editBeneficiaryBirthdateRequested({
        conventionId: "fake-convention-id",
        updatedBeneficiaryBirthDate: "1995-03-15",
        dateStart: "2025-06-01",
        internshipKind: "immersion",
        jwt: "fake-jwt",
        feedbackTopic: "edit-beneficiary-birthdate",
      }),
    );
    expectEditBeneficiaryBirthdateState({
      isLoading: true,
    });
    feedGatewayEditBeneficiaryBirthdateSuccess();

    expectEditBeneficiaryBirthdateState({
      isLoading: false,
    });

    expectToEqual(
      feedbacksSelectors.feedbacks(store.getState())[
        "edit-beneficiary-birthdate"
      ],
      {
        level: "success",
        message: "La date de naissance a bien été modifiée",
        on: "update",
        title: "La date de naissance a bien été modifiée",
      },
    );
  });

  it("gets error message when editing beneficiary birthdate fails", () => {
    store.dispatch(
      editBeneficiaryBirthdateSlice.actions.editBeneficiaryBirthdateRequested({
        conventionId: "fake-convention-id",
        updatedBeneficiaryBirthDate: "1995-03-15",
        dateStart: "2025-06-01",
        internshipKind: "immersion",
        jwt: "fake-jwt",
        feedbackTopic: "edit-beneficiary-birthdate",
      }),
    );
    expectEditBeneficiaryBirthdateState({
      isLoading: true,
    });
    const errorMessage =
      "Une erreur est survenue lors de la modification de la date de naissance.";
    feedGatewayWithEditBeneficiaryBirthdateFailure(new Error(errorMessage));
    expectEditBeneficiaryBirthdateState({
      isLoading: false,
    });

    expectToEqual(
      feedbacksSelectors.feedbacks(store.getState())[
        "edit-beneficiary-birthdate"
      ],
      {
        level: "error",
        message: errorMessage,
        on: "update",
        title: "Problème lors de la modification de la date de naissance",
      },
    );
  });

  const expectEditBeneficiaryBirthdateState = (
    editBeneficiaryBirthdateState: Partial<EditBeneficiaryBirthdateState>,
  ) => {
    expectObjectsToMatch(
      store.getState().editBeneficiaryBirthdate,
      editBeneficiaryBirthdateState,
    );
  };

  const feedGatewayEditBeneficiaryBirthdateSuccess = () => {
    dependencies.conventionGateway.editBeneficiaryBirthdateResult$.next(
      undefined,
    );
  };

  const feedGatewayWithEditBeneficiaryBirthdateFailure = (error: Error) => {
    dependencies.conventionGateway.editBeneficiaryBirthdateResult$.error(error);
  };
});
