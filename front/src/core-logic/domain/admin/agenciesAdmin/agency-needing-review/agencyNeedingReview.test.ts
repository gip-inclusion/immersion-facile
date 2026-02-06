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

    feedWithFetchedAgency(AGENCY_NEEDING_REVIEW_2);

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
    const errorMessage =
      "Une erreur est survenue lors de la récupération des données de cette agence";
    dependencies.agencyGateway.fetchedAgency$.error(new Error(errorMessage));

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

  const feedWithFetchedAgency = (agencyDto: AgencyDto) => {
    dependencies.agencyGateway.fetchedAgency$.next(agencyDto);
  };
});
