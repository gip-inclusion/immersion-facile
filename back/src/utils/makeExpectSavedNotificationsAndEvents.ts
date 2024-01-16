import { partition } from "ramda";
import {
  exhaustiveCheck,
  expectToEqual,
  TemplatedEmail,
  TemplatedSms,
} from "shared";
import {
  EmailNotification,
  Notification,
  NotificationKind,
  notificationKinds,
  SmsNotification,
} from "shared";
import { InMemoryOutboxRepository } from "../adapters/secondary/core/InMemoryOutboxRepository";
import { InMemoryNotificationRepository } from "../adapters/secondary/InMemoryNotificationRepository";
import { NotificationAddedEvent } from "../domain/core/eventBus/events";
import { WithNotificationIdAndKind } from "../domain/generic/notifications/entities/Notification";

export type ExpectSavedNotificationsAndEvents = ReturnType<
  typeof makeExpectSavedNotificationsAndEvents
>;

export const makeExpectSavedNotificationsAndEvents =
  (
    notificationRepository: InMemoryNotificationRepository,
    outboxRepository: InMemoryOutboxRepository,
  ) =>
  ({ emails = [], sms = [] }: ExpectedNotifications) => {
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

    const notificationAddedEvents = outboxRepository.events.filter(
      (event): event is NotificationAddedEvent =>
        event.topic === "NotificationAdded",
    );

    const paramsByKind = {
      email: {
        notificationsOfKind: emailNotifications,
        expectedTemplatedContent: emails,
      },
      sms: {
        notificationsOfKind: smsNotifications,
        expectedTemplatedContent: sms,
      },
    } satisfies ParamByKind;

    notificationKinds.forEach(
      expectNotificationsOfKind(notificationAddedEvents, paramsByKind),
    );
  };

type ExpectedNotifications = {
  emails?: TemplatedEmail[];
  sms?: TemplatedSms[];
};

type ParamByKind = {
  [K in NotificationKind]: {
    // prettier-ignore
    expectedTemplatedContent: Array<Extract<Notification, {kind: K;}>["templatedContent"]>;
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
