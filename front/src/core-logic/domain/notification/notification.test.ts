import { expectToEqual, keys } from "shared";
import { apiConsumerSlice } from "src/core-logic/domain/apiConsumer/apiConsumer.slice";
import { notificationsSelectors } from "src/core-logic/domain/notification/notification.selectors";
import {
  ActionKindAndLevel,
  NotificationTopic,
  feedbackMapping,
  getLevelFromActionKindAndLevel,
} from "src/core-logic/domain/notification/notification.slice";
import { createTestStore } from "src/core-logic/storeConfig/createTestStore";
import { ReduxStore } from "src/core-logic/storeConfig/store";

describe("Notifications", () => {
  let store: ReduxStore;

  beforeEach(() => {
    ({ store } = createTestStore());
  });

  describe("notifications slice extra reducers", () => {
    it("stores notification with level success from other slice", () => {
      expectToEqual(notificationsSelectors.notifications(store.getState()), {});

      store.dispatch(
        apiConsumerSlice.actions.saveApiConsumerSucceeded({
          apiConsumerJwt: "jwt",
          feedbackTopic: "api-consumer-global",
        }),
      );
      expect(
        keys(notificationsSelectors.notifications(store.getState())),
      ).toHaveLength(1);
      expectNotificationStoreByTopicToEqual({
        topic: "api-consumer-global",
        kindAndLevel: "create.success",
      });
    });
    it("stores notification with level error from other slice", () => {
      expectToEqual(notificationsSelectors.notifications(store.getState()), {});

      store.dispatch(
        apiConsumerSlice.actions.saveApiConsumerFailed({
          errorMessage: "fake error message",
          feedbackTopic: "api-consumer-global",
        }),
      );
      expect(
        keys(notificationsSelectors.notifications(store.getState())),
      ).toHaveLength(1);
      expectNotificationStoreByTopicToEqual({
        topic: "api-consumer-global",
        kindAndLevel: "create.error",
      });
    });
  });
  const expectNotificationStoreByTopicToEqual = ({
    topic,
    kindAndLevel,
  }: { topic: NotificationTopic; kindAndLevel: ActionKindAndLevel }) =>
    expectToEqual(
      notificationsSelectors.notifications(store.getState())[topic],
      {
        level: getLevelFromActionKindAndLevel(kindAndLevel),
        title: feedbackMapping[topic][kindAndLevel]?.title,
        // biome-ignore lint/style/noNonNullAssertion:
        message: feedbackMapping[topic][kindAndLevel]!.message,
      },
    );
});
