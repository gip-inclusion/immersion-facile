import {
  type EmailNotification,
  type NotificationsByKind,
  type SmsNotification,
  expectToEqual,
} from "shared";
import { adminSelectors } from "src/core-logic/domain/admin/admin.selectors";
import { notificationsSlice } from "src/core-logic/domain/admin/notifications/notificationsSlice";
import {
  type TestDependencies,
  createTestStore,
} from "src/core-logic/storeConfig/createTestStore";
import type { ReduxStore } from "src/core-logic/storeConfig/store";

describe("notifications slice", () => {
  let store: ReduxStore;
  let dependencies: TestDependencies;

  beforeEach(() => {
    ({ store, dependencies } = createTestStore());
  });

  describe("get latest sent emails and sms", () => {
    it("gets the last emails sent from the backend", () => {
      store.dispatch(
        notificationsSlice.actions.getLastNotificationsRequested(),
      );
      expectIsLoadingToBe(true);
      const emails: EmailNotification[] = [
        {
          id: "123",
          createdAt: "2022-07-10",
          kind: "email",
          followedIds: {},
          templatedContent: {
            kind: "TEST_EMAIL",
            recipients: ["bob@mail.com"],
            params: {
              url: "https://my-url",
              input1: "24 rue des boucher 67000 strasbourg",
              input2: "SAS FRANCE MERGUEZ DISTRIBUTION",
            },
          },
        },
      ];
      const sms: SmsNotification[] = [
        {
          id: "456",
          createdAt: "2022-07-10",
          kind: "sms",
          followedIds: {},
          templatedContent: {
            kind: "LastReminderForSignatories",
            recipientPhone: "060011002200",
            params: { shortLink: "http://my-url" },
          },
        },
      ];
      feedGatewayWithNotifications({ emails, sms });
      expectNotifications({ emails, sms });
      expectIsLoadingToBe(false);
    });

    it("stores the error when something goes wrong", () => {
      store.dispatch(
        notificationsSlice.actions.getLastNotificationsRequested(),
      );
      expectIsLoadingToBe(true);
      feedSentEmailGatewayWithError(new Error("Something went wrong"));
      expectError("Something went wrong");
      expectIsLoadingToBe(false);
    });

    it("should clear the notifications when the requested", () => {
      store.dispatch(
        notificationsSlice.actions.getLastNotificationsRequested(),
      );
      expectIsLoadingToBe(true);
      const emails: EmailNotification[] = [
        {
          id: "123",
          createdAt: "2022-07-10",
          kind: "email",
          followedIds: {},
          templatedContent: {
            kind: "TEST_EMAIL",
            recipients: ["bob@mail.com"],
            params: {
              url: "https://my-url",
              input1: "24 rue des boucher 67000 strasbourg",
              input2: "SAS FRANCE MERGUEZ DISTRIBUTION",
            },
          },
        },
      ];
      const sms: SmsNotification[] = [
        {
          id: "456",
          createdAt: "2022-07-10",
          kind: "sms",
          followedIds: {},
          templatedContent: {
            kind: "LastReminderForSignatories",
            recipientPhone: "060011002200",
            params: { shortLink: "http://my-url" },
          },
        },
      ];
      feedGatewayWithNotifications({ emails, sms });
      expectNotifications({ emails, sms });
      expectIsLoadingToBe(false);

      store.dispatch(notificationsSlice.actions.clearNotificationsRequested());
      expectIsLoadingToBe(false);
      expectNotifications({ emails: [], sms: [] });
    });
  });

  const expectIsLoadingToBe = (expected: boolean) => {
    expect(adminSelectors.notifications.isLoading(store.getState())).toBe(
      expected,
    );
  };

  const expectError = (expected: string) => {
    expect(adminSelectors.notifications.error(store.getState())).toBe(expected);
  };

  const expectNotifications = (expected: NotificationsByKind) => {
    expectToEqual(
      adminSelectors.notifications.emails(store.getState()),
      expected.emails,
    );
    expectToEqual(
      adminSelectors.notifications.sms(store.getState()),
      expected.sms,
    );
  };

  const feedGatewayWithNotifications = (
    notificationsByKind: NotificationsByKind,
  ) => {
    dependencies.adminGateway.lastNotifications$.next(notificationsByKind);
  };

  const feedSentEmailGatewayWithError = (error: Error) => {
    dependencies.adminGateway.lastNotifications$.error(error);
  };
});
