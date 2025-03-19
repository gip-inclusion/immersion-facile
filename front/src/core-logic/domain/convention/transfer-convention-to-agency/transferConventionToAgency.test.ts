import { expectObjectsToMatch, expectToEqual } from "shared";
import {
  type TransferConventionToAgencyState,
  transferConventionToAgencyInitialState,
  transferConventionToAgencySlice,
} from "src/core-logic/domain/convention/transfer-convention-to-agency/transferConventionToAgency.slice";
import { feedbacksSelectors } from "src/core-logic/domain/feedback/feedback.selectors";
import {
  type TestDependencies,
  createTestStore,
} from "src/core-logic/storeConfig/createTestStore";
import type { ReduxStore } from "src/core-logic/storeConfig/store";

describe("transferConventionToAgency slice", () => {
  let store: ReduxStore;
  let dependencies: TestDependencies;

  beforeEach(() => {
    ({ store, dependencies } = createTestStore({
      transferConventionToAgency: {
        ...transferConventionToAgencyInitialState,
      },
    }));
  });

  it("transfers convention to agency", () => {
    store.dispatch(
      transferConventionToAgencySlice.actions.transferConventionToAgencyRequested(
        {
          conventionId: "fake-covention-id",
          agencyId: "fake-agency-id",
          justification: "fake-justification",
          jwt: "fake-jwt",
          feedbackTopic: "transfer-convention-to-agency",
        },
      ),
    );
    expectTransferConventionToAgencyState({
      isLoading: true,
    });
    feedGatewayTransferConventionToAgencySuccess();

    expectTransferConventionToAgencyState({
      isLoading: false,
    });

    expectToEqual(
      feedbacksSelectors.feedbacks(store.getState())[
        "transfer-convention-to-agency"
      ],
      {
        level: "success",
        message: "La convention a bien été transférée au nouvel organisme",
        on: "create",
        title: "La convention a bien été transférée",
      },
    );
  });

  it("gets error message when transferring convention to agency fails", () => {
    store.dispatch(
      transferConventionToAgencySlice.actions.transferConventionToAgencyRequested(
        {
          conventionId: "fake-covention-id",
          agencyId: "fake-agency-id",
          justification: "fake-justification",
          jwt: "fake-jwt",
          feedbackTopic: "transfer-convention-to-agency",
        },
      ),
    );
    expectTransferConventionToAgencyState({
      isLoading: true,
    });
    const errorMessage =
      "Une erreur est survenue lors du transfert de la convention.";
    feedGatewayWithTransferConventionToAgencyFailure(new Error(errorMessage));
    expectTransferConventionToAgencyState({
      isLoading: false,
    });

    expectToEqual(
      feedbacksSelectors.feedbacks(store.getState())[
        "transfer-convention-to-agency"
      ],
      {
        level: "error",
        message: errorMessage,
        on: "create",
        title: "Problème lors du transfert de la convention",
      },
    );
  });

  const expectTransferConventionToAgencyState = (
    transferConventionToAgencyState: Partial<TransferConventionToAgencyState>,
  ) => {
    expectObjectsToMatch(
      store.getState().transferConventionToAgency,
      transferConventionToAgencyState,
    );
  };

  const feedGatewayTransferConventionToAgencySuccess = () => {
    dependencies.conventionGateway.transferConventionToAgencyResult$.next(
      undefined,
    );
  };

  const feedGatewayWithTransferConventionToAgencyFailure = (error: Error) => {
    dependencies.conventionGateway.transferConventionToAgencyResult$.error(
      error,
    );
  };
});
