import { expectToEqual } from "shared";
import type { TestAgencyGateway } from "src/core-logic/adapters/AgencyGateway/TestAgencyGateway";

import { agenciesPreloadedState } from "src/core-logic/domain/agencies/agenciesPreloadedState";
import { closeAgencyAndTransfertConventionsSlice } from "src/core-logic/domain/agencies/close-agency-and-transfert-conventions/closeAgencyAndTransfertConventions.slice";

import { feedbacksSelectors } from "src/core-logic/domain/feedback/feedback.selectors";
import {
  createTestStore,
  type TestDependencies,
} from "src/core-logic/storeConfig/createTestStore";
import type { ReduxStore } from "src/core-logic/storeConfig/store";

describe("closeAgencyAndTransfertConventions", () => {
  let store: ReduxStore;
  let dependencies: TestDependencies;
  let agencyGateway: TestAgencyGateway;

  beforeEach(() => {
    ({ store, dependencies } = createTestStore({
      agency: agenciesPreloadedState({}),
    }));
    agencyGateway = dependencies.agencyGateway as TestAgencyGateway;
  });

  it("success ", () => {
    store.dispatch(
      closeAgencyAndTransfertConventionsSlice.actions.closeAgencyAndTransfertConventionsRequested(
        {
          agencyToCloseId: "agency-to-close-id",
          agencyToTransferConventionsToId: "agency-target-id",
          feedbackTopic: "close-agency-and-transfert-conventions",
        },
      ),
    );
    agencyGateway.closeAgencyAndTransfertConventionsResponse$.next(undefined);

    expectToEqual(
      store.getState().agency.closeAgencyAndTransfertConventions.isLoading,
      false,
    );

    expectToEqual(
      feedbacksSelectors.feedbacks(store.getState())[
        "close-agency-and-transfert-conventions"
      ],
      {
        level: "success",
        message:
          "L'agence a été fermée et les conventions ont été transférées vers la nouvelle agence.",
        on: "update",
        title: "Transfert des conventions effectué",
      },
    );
  });

  it("error on backend", () => {
    store.dispatch(
      closeAgencyAndTransfertConventionsSlice.actions.closeAgencyAndTransfertConventionsRequested(
        {
          agencyToCloseId: "agency-to-close-id",
          agencyToTransferConventionsToId: "agency-target-id",
          feedbackTopic: "close-agency-and-transfert-conventions",
        },
      ),
    );

    expectToEqual(
      store.getState().agency.closeAgencyAndTransfertConventions.isLoading,
      true,
    );

    agencyGateway.closeAgencyAndTransfertConventionsResponse$.error(
      new Error("Agency not found"),
    );

    expectToEqual(
      store.getState().agency.closeAgencyAndTransfertConventions.isLoading,
      false,
    );

    expectToEqual(feedbacksSelectors.feedbacks(store.getState()), {
      "close-agency-and-transfert-conventions": {
        title: "Problème lors du transfert des conventions",
        level: "error",
        on: "update",
        message: "Agency not found",
      },
    });
  });
});
