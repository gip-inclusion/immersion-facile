import { expectToEqual, keys } from "shared";
import { apiConsumerSlice } from "src/core-logic/domain/apiConsumer/apiConsumer.slice";
import { feedbacksSelectors } from "src/core-logic/domain/feedback/feedback.selectors";
import {
  ActionKindAndLevel,
  FeedbackTopic,
  feedbackMapping,
  getLevelFromActionKindAndLevel,
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
      });
    });
  });
  const expectFeedbackStoreByTopicToEqual = ({
    topic,
    kindAndLevel,
  }: { topic: FeedbackTopic; kindAndLevel: ActionKindAndLevel }) =>
    expectToEqual(feedbacksSelectors.feedbacks(store.getState())[topic], {
      level: getLevelFromActionKindAndLevel(kindAndLevel),
      title: feedbackMapping[topic][kindAndLevel]?.title,
      // biome-ignore lint/style/noNonNullAssertion:
      message: feedbackMapping[topic][kindAndLevel]!.message,
    });
});
