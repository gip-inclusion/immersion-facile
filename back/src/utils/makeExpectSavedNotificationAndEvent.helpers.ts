import { partition } from "ramda";
import {
  TemplatedEmail,
  TemplatedSms,
  exhaustiveCheck,
  expectToEqual,
} from "shared";
import {
  EmailNotification,
  Notification,
  NotificationKind,
  SmsNotification,
  notificationKinds,
} from "shared";
import { InMemoryOutboxRepository } from "../domains/core/events/adapters/InMemoryOutboxRepository";
import {
  NotificationAddedEvent,
  NotificationBatchAddedEvent,
} from "../domains/core/events/events";
import { InMemoryNotificationRepository } from "../domains/core/notifications/adapters/InMemoryNotificationRepository";
import { WithNotificationIdAndKind } from "../domains/core/notifications/helpers/Notification";

export type ExpectSavedNotificationsAndEvents = ReturnType<
  typeof makeExpectSavedNotificationsAndEvents
>;

export const makeExpectSavedNotificationsAndEvents = (
  notificationRepository: InMemoryNotificationRepository,
  outboxRepository: InMemoryOutboxRepository,
) => {
  return ({ emails = [], sms = [] }: ExpectedNotifications) => {
    const paramsByKind = createParamsByKind(
      notificationRepository,
      emails,
      sms,
    );

    const notificationAddedEvents = outboxRepository.events.filter(
      (event): event is NotificationAddedEvent =>
        event.topic === "NotificationAdded",
    );

    notificationKinds.forEach(
      expectNotificationsOfKind(notificationAddedEvents, paramsByKind),
    );
  };
};

export type ExpectSavedNotificationsBatchAndEvent = ReturnType<
  typeof makeExpectSavedNotificationsBatchAndEvent
>;
export const makeExpectSavedNotificationsBatchAndEvent = (
  notificationRepository: InMemoryNotificationRepository,
  outboxRepository: InMemoryOutboxRepository,
) => {
  return ({ emails = [], sms = [] }: ExpectedNotifications) => {
    const paramsByKind = createParamsByKind(
      notificationRepository,
      emails,
      sms,
    );

    const notificationBatchAddedEvents = outboxRepository.events.filter(
      (event): event is NotificationBatchAddedEvent =>
        event.topic === "NotificationBatchAdded",
    );

    expect(notificationBatchAddedEvents.length).toBeLessThanOrEqual(1);

    if (notificationBatchAddedEvents.length === 0) {
      expectToEqual(paramsByKind.email.notificationsOfKind, []);
      expectToEqual(paramsByKind.sms.notificationsOfKind, []);
    } else {
      notificationKinds.forEach(
        expectNotificationsBatch(notificationBatchAddedEvents[0], paramsByKind),
      );
    }
  };
};

type ExpectedNotifications = {
  emails?: TemplatedEmail[];
  sms?: TemplatedSms[];
  inBatch?: boolean;
};

const createParamsByKind = (
  notificationRepository: InMemoryNotificationRepository,
  emails: TemplatedEmail[],
  sms: TemplatedSms[],
) => {
  const [emailNotifications, smsNotifications] = partition(({ kind }) => {
    switch (kind) {
      case "email":
        return true;
      case "sms":
        return false;
      default:
        return exhaustiveCheck(kind, { throwIfReached: true });
    }
  }, notificationRepository.notifications) as [
    EmailNotification[],
    SmsNotification[],
  ];

  return {
    email: {
      notificationsOfKind: emailNotifications,
      expectedTemplatedContent: emails,
    },
    sms: {
      notificationsOfKind: smsNotifications,
      expectedTemplatedContent: sms,
    },
  } satisfies ParamByKind;
};

type ParamByKind = {
  [K in NotificationKind]: {
    expectedTemplatedContent: Array<
      Extract<Notification, { kind: K }>["templatedContent"]
    >;
    notificationsOfKind: Array<Extract<Notification, { kind: K }>>;
  };
};

const expectNotificationsOfKind =
  (
    notificationAddedEvents: NotificationAddedEvent[],
    paramsByKind: ParamByKind,
  ) =>
  (kind: NotificationKind) => {
    const { notificationsOfKind, expectedTemplatedContent } =
      paramsByKind[kind];

    expectToEqual(
      notificationsOfKind.map(({ templatedContent }) => templatedContent),
      expectedTemplatedContent,
    );

    expectToEqual(
      notificationsOfKind.map(
        ({ id }): WithNotificationIdAndKind => ({ id, kind }),
      ),
      notificationAddedEvents
        .filter(({ payload }) => payload.kind === kind)
        .map(({ payload }) => payload),
    );
  };

const expectNotificationsBatch =
  (
    notificationBatchAddedEvent: NotificationBatchAddedEvent,
    paramsByKind: ParamByKind,
  ) =>
  (kind: NotificationKind) => {
    const { notificationsOfKind, expectedTemplatedContent } =
      paramsByKind[kind];

    expectToEqual(
      notificationsOfKind.map(({ templatedContent }) => templatedContent),
      expectedTemplatedContent,
    );

    expectToEqual(
      notificationsOfKind.map(
        ({ id }): WithNotificationIdAndKind => ({ id, kind }),
      ),
      notificationBatchAddedEvent.payload.filter(
        (payload) => payload.kind === kind,
      ),
    );
  };
