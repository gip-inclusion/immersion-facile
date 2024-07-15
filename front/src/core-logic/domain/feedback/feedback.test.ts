import { expectToEqual, keys } from "shared";
import { apiConsumerSlice } from "src/core-logic/domain/apiConsumer/apiConsumer.slice";
import { discussionSlice } from "src/core-logic/domain/discussion/discussion.slice";
import { feedbacksSelectors } from "src/core-logic/domain/feedback/feedback.selectors";
import {
  ActionKindAndLevel,
  FeedbackTopic,
  feedbackMapping,
  getLevelAndActionKindFromActionKindAndLevel,
} from "src/core-logic/domain/feedback/feedback.slice";
import { createTestStore } from "src/core-logic/storeConfig/createTestStore";
import { ReduxStore } from "src/core-logic/storeConfig/store";

describe("Feedbacks", () => {
  let store: ReduxStore;

  beforeEach(() => {
    ({ store } = createTestStore());
  });

  describe("feedbacks slice extra reducers", () => {
    it("stores feedback with level success from other slice", () => {
      expectToEqual(feedbacksSelectors.feedbacks(store.getState()), {});

      store.dispatch(
        apiConsumerSlice.actions.saveApiConsumerSucceeded({
          apiConsumerJwt: "jwt",
          feedbackTopic: "api-consumer-global",
        }),
      );
      expect(keys(feedbacksSelectors.feedbacks(store.getState()))).toHaveLength(
        1,
      );
      expectFeedbackStoreByTopicToEqual({
        topic: "api-consumer-global",
        kindAndLevel: "create.success",
      });
    });
    it("stores feedback with level error from other slice", () => {
      expectToEqual(feedbacksSelectors.feedbacks(store.getState()), {});

      store.dispatch(
        apiConsumerSlice.actions.saveApiConsumerFailed({
          errorMessage: "fake error message",
          feedbackTopic: "api-consumer-global",
        }),
      );
      expect(keys(feedbacksSelectors.feedbacks(store.getState()))).toHaveLength(
        1,
      );
      expectFeedbackStoreByTopicToEqual({
        topic: "api-consumer-global",
        kindAndLevel: "create.error",
        errorMessageFromApi: "fake error message",
      });
    });
    it("stores feedback with fetch level error from another slice", () => {
      expectToEqual(feedbacksSelectors.feedbacks(store.getState()), {});

      store.dispatch(
        discussionSlice.actions.updateDiscussionStatusSucceeded({
          feedbackTopic: "dashboard-discussion-rejection",
        }),
      );
      expect(keys(feedbacksSelectors.feedbacks(store.getState()))).toHaveLength(
        1,
      );
      expectFeedbackStoreByTopicToEqual({
        topic: "dashboard-discussion-rejection",
        kindAndLevel: "update.success",
      });
    });
  });
  const expectFeedbackStoreByTopicToEqual = ({
    topic,
    kindAndLevel,
    errorMessageFromApi,
  }: {
    topic: FeedbackTopic;
    kindAndLevel: ActionKindAndLevel;
    errorMessageFromApi?: string;
  }) =>
    expectToEqual(feedbacksSelectors.feedbacks(store.getState())[topic], {
      on: getLevelAndActionKindFromActionKindAndLevel(kindAndLevel).actionKind,
      level: getLevelAndActionKindFromActionKindAndLevel(kindAndLevel).level,
      title: feedbackMapping[topic][kindAndLevel]?.title,
      message:
        // biome-ignore lint/style/noNonNullAssertion:
        errorMessageFromApi ?? feedbackMapping[topic][kindAndLevel]!.message,
    });
});
