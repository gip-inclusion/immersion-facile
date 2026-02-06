import type { AgencyDto } from "shared";
import { expectToEqual } from "shared";
import { adminPreloadedState } from "src/core-logic/domain/admin/adminPreloadedState";
import { agencyNeedingReviewSelectors } from "src/core-logic/domain/admin/agenciesAdmin/agency-needing-review/agencyNeedingReview.selectors";
import {
  agencyNeedingReviewInitialState,
  agencyNeedingReviewSlice,
} from "src/core-logic/domain/admin/agenciesAdmin/agency-needing-review/agencyNeedingReview.slice";
import { feedbacksSelectors } from "src/core-logic/domain/feedback/feedback.selectors";
import {
  createTestStore,
  type TestDependencies,
} from "src/core-logic/storeConfig/createTestStore";
import type { ReduxStore } from "src/core-logic/storeConfig/store";
import { AGENCY_NEEDING_REVIEW_2 } from "../../../../adapters/AgencyGateway/SimulatedAgencyGateway";

describe("agencyNeedingReview", () => {
  let store: ReduxStore;
  let dependencies: TestDependencies;

  beforeEach(() => {
    ({ store, dependencies } = createTestStore());
  });

  it("successfully fetches agency needing review", () => {
    store.dispatch(
      agencyNeedingReviewSlice.actions.fetchAgencyNeedingReviewRequested({
        agencyId: AGENCY_NEEDING_REVIEW_2.id,
        feedbackTopic: "agency-admin-needing-review",
      }),
    );

    expectToEqual(
      agencyNeedingReviewSelectors.isLoading(store.getState()),
      true,
    );

    feedWithFetchedAgency(AGENCY_NEEDING_REVIEW_2);

    expectToEqual(
      agencyNeedingReviewSelectors.isLoading(store.getState()),
      false,
    );

    expectToEqual(
      agencyNeedingReviewSelectors.agencyNeedingReview(store.getState()),
      AGENCY_NEEDING_REVIEW_2,
    );
  });

  it("fails to fetch agency needing review and stores error in feedback slice", () => {
    store.dispatch(
      agencyNeedingReviewSlice.actions.fetchAgencyNeedingReviewRequested({
        agencyId: AGENCY_NEEDING_REVIEW_2.id,
        feedbackTopic: "agency-admin-needing-review",
      }),
    );

    expectToEqual(
      agencyNeedingReviewSelectors.isLoading(store.getState()),
      true,
    );

    const errorMessage =
      "Une erreur est survenue lors de la récupération des données de cette agence";

    dependencies.agencyGateway.fetchedAgency$.error(new Error(errorMessage));

    expectToEqual(
      agencyNeedingReviewSelectors.isLoading(store.getState()),
      false,
    );

    expectToEqual(
      feedbacksSelectors.feedbacks(store.getState())[
        "agency-admin-needing-review"
      ],
      {
        on: "fetch",
        level: "error",
        title:
          "Problème rencontré lors de la récupération des données de l'agence à valider",
        message: errorMessage,
      },
    );
  });

  it("clears agency when clearAgencyNeedingReview is dispatched", () => {
    ({ store, dependencies } = createTestStore({
      admin: adminPreloadedState({
        agencyNeedingReview: {
          ...agencyNeedingReviewInitialState,
          agencyNeedingReview: AGENCY_NEEDING_REVIEW_2,
        },
      }),
    }));

    store.dispatch(agencyNeedingReviewSlice.actions.clearAgencyNeedingReview());

    expectToEqual(
      agencyNeedingReviewSelectors.agencyNeedingReview(store.getState()),
      null,
    );
  });

  describe("update agency needing review status", () => {
    beforeEach(() => {
      ({ store, dependencies } = createTestStore({
        admin: adminPreloadedState({
          agencyNeedingReview: {
            ...agencyNeedingReviewInitialState,
            agencyNeedingReview: AGENCY_NEEDING_REVIEW_2,
          },
        }),
      }));
    });

    it("when update succeeds", () => {
      store.dispatch(
        agencyNeedingReviewSlice.actions.updateAgencyNeedingReviewStatusRequested(
          {
            id: AGENCY_NEEDING_REVIEW_2.id,
            status: "active",
            feedbackTopic: "agency-admin-needing-review",
          },
        ),
      );

      expectToEqual(
        agencyNeedingReviewSelectors.isLoading(store.getState()),
        true,
      );

      feedWithValidateOrRejectSuccess();

      expectToEqual(
        agencyNeedingReviewSelectors.isLoading(store.getState()),
        false,
      );
      expectToEqual(
        feedbacksSelectors.feedbacks(store.getState())[
          "agency-admin-needing-review"
        ],
        {
          on: "update",
          level: "success",
          title: "Statut de l'agence mis à jour",
          message: "L'agence a été activée ou rejetée avec succès.",
        },
      );
    });

    it("when update fails", () => {
      store.dispatch(
        agencyNeedingReviewSlice.actions.updateAgencyNeedingReviewStatusRequested(
          {
            id: AGENCY_NEEDING_REVIEW_2.id,
            status: "active",
            feedbackTopic: "agency-admin-needing-review",
          },
        ),
      );
      const errorMessage = "Network error";
      feedWithValidateOrRejectError(errorMessage);
      expectToEqual(
        agencyNeedingReviewSelectors.isLoading(store.getState()),
        false,
      );
      expectToEqual(
        feedbacksSelectors.feedbacks(store.getState())[
          "agency-admin-needing-review"
        ],
        {
          on: "update",
          level: "error",
          title: "Problème lors de la mise à jour du statut de l'agence",
          message: errorMessage,
        },
      );
    });
  });

  const feedWithFetchedAgency = (agencyDto: AgencyDto) => {
    dependencies.agencyGateway.fetchedAgency$.next(agencyDto);
  };

  const feedWithValidateOrRejectSuccess = () => {
    dependencies.agencyGateway.validateOrRejectAgencyResponse$.next(undefined);
  };

  const feedWithValidateOrRejectError = (msg: string) => {
    dependencies.agencyGateway.validateOrRejectAgencyResponse$.error(
      new Error(msg),
    );
  };
});
