import { partition } from "ramda";
import {
  exhaustiveCheck,
  expectToEqual,
  TemplatedEmail,
  TemplatedSms,
} from "shared";
import { InMemoryOutboxRepository } from "../adapters/secondary/core/InMemoryOutboxRepository";
import { InMemoryNotificationRepository } from "../adapters/secondary/InMemoryNotificationRepository";
import { NotificationAddedEvent } from "../domain/core/eventBus/events";
import {
  EmailNotification,
  SmsNotification,
  WithNotificationIdAndKind,
} from "../domain/generic/notifications/entities/Notification";

export type ExpectSavedNotificationsAndEvents = ReturnType<
  typeof makeExpectSavedNotificationsAndEvents
>;
export const makeExpectSavedNotificationsAndEvents =
  (
    notificationRepository: InMemoryNotificationRepository,
    outboxRepository: InMemoryOutboxRepository,
  ) =>
  ({
    emails: expectedEmail = [],
    sms: expectedSms = [],
  }: {
    emails?: TemplatedEmail[];
    sms?: TemplatedSms[];
  }) => {
    const [emailNotification, smsNotification] = partition(({ kind }) => {
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

    expectToEqual(
      emailNotification.map(({ templatedContent }) => templatedContent),
      expectedEmail,
    );
    expectToEqual(
      emailNotification.map(
        ({ id }): WithNotificationIdAndKind => ({ id, kind: "email" }),
      ),
      notificationAddedEvents
        .filter(({ payload }) => payload.kind === "email")
        .map(({ payload }) => payload),
    );

    expectToEqual(
      smsNotification.map(({ templatedContent }) => templatedContent),
      expectedSms,
    );
    expectToEqual(
      smsNotification.map(
        ({ id }): WithNotificationIdAndKind => ({ id, kind: "sms" }),
      ),
      notificationAddedEvents
        .filter(({ payload }) => payload.kind === "sms")
        .map(({ payload }) => payload),
    );
  };
