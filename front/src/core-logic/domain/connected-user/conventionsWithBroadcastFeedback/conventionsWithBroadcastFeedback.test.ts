import { expectToEqual, type Pagination } from "shared";
import { conventionsWithBroadcastFeedbackSelectors } from "src/core-logic/domain/connected-user/conventionsWithBroadcastFeedback/conventionsWithBroadcastFeedback.selectors";
import { conventionsWithBroadcastFeedbackSlice } from "src/core-logic/domain/connected-user/conventionsWithBroadcastFeedback/conventionsWithBroadcastFeedback.slice";
import { feedbacksSelectors } from "src/core-logic/domain/feedback/feedback.selectors";
import {
  createTestStore,
  type TestDependencies,
} from "src/core-logic/storeConfig/createTestStore";
import type { ReduxStore } from "src/core-logic/storeConfig/store";
import type { ConventionWithBroadcastFeedback } from "../../../../../../shared/src/convention/conventionWithBroadcastFeedback.dto";

describe("ConnectedUserConventionsWithBroadcastFeedback", () => {
  let store: ReduxStore;
  let dependencies: TestDependencies;

  beforeEach(() => {
    ({ store, dependencies } = createTestStore());
  });

  it("get the conventions with errored broadcast feedback", () => {
    const pagination: Pagination = {
      totalRecords: 1,
      currentPage: 1,
      totalPages: 1,
      numberPerPage: 10,
    };
    const conventionsWithBroadcastFeedback: ConventionWithBroadcastFeedback[] =
      [
        {
          id: "1",
          beneficiary: {
            firstname: "John",
            lastname: "Doe",
          },
          broadcastFeedback: {
            serviceName: "any-service-name",
            consumerId: null,
            consumerName: "any-consumer-name",
            occurredAt: "2024-07-01T00:00:00.000Z",
            handledByAgency: true,
            requestParams: {
              conventionId: "1",
            },
          },
        },
      ];
    expectToEqual(
      conventionsWithBroadcastFeedbackSelectors.isLoading(store.getState()),
      false,
    );

    store.dispatch(
      conventionsWithBroadcastFeedbackSlice.actions.getConventionsWithErroredBroadcastFeedbackRequested(
        {
          params: { page: 1, perPage: 10 },
          jwt: "my-jwt",
          feedbackTopic: "conventions-with-broadcast-feedback",
        },
      ),
    );

    expectToEqual(
      conventionsWithBroadcastFeedbackSelectors.isLoading(store.getState()),
      true,
    );
    dependencies.conventionGateway.getConventionsWithErroredBroadcastFeedbackResult$.next(
      {
        data: conventionsWithBroadcastFeedback,
        pagination,
      },
    );
    expectToEqual(
      conventionsWithBroadcastFeedbackSelectors.pagination(store.getState()),
      pagination,
    );
    expectToEqual(
      conventionsWithBroadcastFeedbackSelectors.conventionsWithBroadcastFeedback(
        store.getState(),
      ),
      conventionsWithBroadcastFeedback,
    );
  });

  it("get the conventions with errored broadcast feedback failed", () => {
    expectToEqual(
      conventionsWithBroadcastFeedbackSelectors.isLoading(store.getState()),
      false,
    );

    store.dispatch(
      conventionsWithBroadcastFeedbackSlice.actions.getConventionsWithErroredBroadcastFeedbackRequested(
        {
          feedbackTopic: "conventions-with-broadcast-feedback",
          params: { page: 1, perPage: 10 },
          jwt: "my-jwt",
        },
      ),
    );

    expectToEqual(
      conventionsWithBroadcastFeedbackSelectors.isLoading(store.getState()),
      true,
    );

    dependencies.conventionGateway.getConventionsWithErroredBroadcastFeedbackResult$.error(
      new Error("any-error-message"),
    );

    expectToEqual(
      conventionsWithBroadcastFeedbackSelectors.isLoading(store.getState()),
      false,
    );
    expectToEqual(feedbacksSelectors.feedbacks(store.getState()), {
      "conventions-with-broadcast-feedback": {
        on: "fetch",
        level: "error",
        title:
          "Problème lors de la récupération de vos conventions qui ont eu des erreurs de diffusion",
        message: "any-error-message",
      },
    });
  });
});
