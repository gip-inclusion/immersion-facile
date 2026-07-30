import { expectToEqual } from "shared";
import { CustomTimeGateway } from "../../time-gateway/adapters/CustomTimeGateway";
import {
  createInMemoryUow,
  type InMemoryUnitOfWork,
} from "../../unit-of-work/adapters/createInMemoryUow";
import { TestUuidGenerator } from "../../uuid-generator/adapters/UuidGeneratorImplementations";
import {
  makeSaveNotificationsBatchAndRelatedEvent,
  type NotificationContentAndFollowedIds,
} from "./Notification";

describe("makeSaveNotificationsBatchAndRelatedEvent", () => {
  const now = new Date("2026-07-30T10:00:00.000Z");
  const emailNotification = (
    recipient: string,
  ): NotificationContentAndFollowedIds => ({
    kind: "email",
    followedIds: { agencyId: "agency-id" },
    templatedContent: {
      kind: "AGENCY_WAS_REJECTED",
      params: {
        agencyName: "Agence",
        statusJustification: "Justification",
      },
      recipients: [recipient],
    },
  });
  const smsNotification: NotificationContentAndFollowedIds = {
    kind: "sms",
    followedIds: { conventionId: "convention-id" },
    templatedContent: {
      kind: "HelloWorld",
      params: { testMessage: "Bonjour" },
      recipientPhone: "33612345678",
    },
  };

  let uow: InMemoryUnitOfWork;
  let uuidGenerator: TestUuidGenerator;

  beforeEach(() => {
    uow = createInMemoryUow();
    uuidGenerator = new TestUuidGenerator();
  });

  it("does not save notifications or events for an empty batch", async () => {
    const saveNotificationsBatchAndRelatedEvent =
      makeSaveNotificationsBatchAndRelatedEvent(
        uuidGenerator,
        new CustomTimeGateway(now),
      );

    expectToEqual(await saveNotificationsBatchAndRelatedEvent(uow, []), []);
    expectToEqual(uow.notificationRepository.notifications, []);
    expectToEqual(uow.outboxRepository.events, []);
  });

  it("saves one NotificationAdded event per email with the default priority", async () => {
    uuidGenerator.setNextUuids([
      "notification-1",
      "notification-2",
      "event-1",
      "event-2",
    ]);
    const saveNotificationsBatchAndRelatedEvent =
      makeSaveNotificationsBatchAndRelatedEvent(
        uuidGenerator,
        new CustomTimeGateway(now),
      );

    const savedNotifications = await saveNotificationsBatchAndRelatedEvent(
      uow,
      [
        emailNotification("first@example.com"),
        emailNotification("second@example.com"),
      ],
    );

    const expectedNotifications = [
      {
        ...emailNotification("first@example.com"),
        id: "notification-1",
        createdAt: now.toISOString(),
      },
      {
        ...emailNotification("second@example.com"),
        id: "notification-2",
        createdAt: now.toISOString(),
      },
    ];
    expectToEqual(savedNotifications, expectedNotifications);
    expectToEqual(
      uow.notificationRepository.notifications,
      expectedNotifications,
    );
    expectToEqual(uow.outboxRepository.events, [
      {
        id: "event-1",
        topic: "NotificationAdded",
        payload: { id: "notification-1", kind: "email" },
        priority: 5,
        occurredAt: now.toISOString(),
        publications: [],
        status: "never-published",
        wasQuarantined: false,
      },
      {
        id: "event-2",
        topic: "NotificationAdded",
        payload: { id: "notification-2", kind: "email" },
        priority: 5,
        occurredAt: now.toISOString(),
        publications: [],
        status: "never-published",
        wasQuarantined: false,
      },
    ]);
  });

  it("preserves each notification kind in a mixed batch", async () => {
    uuidGenerator.setNextUuids([
      "email-notification",
      "sms-notification",
      "email-event",
      "sms-event",
    ]);
    const saveNotificationsBatchAndRelatedEvent =
      makeSaveNotificationsBatchAndRelatedEvent(
        uuidGenerator,
        new CustomTimeGateway(now),
      );

    await saveNotificationsBatchAndRelatedEvent(uow, [
      emailNotification("recipient@example.com"),
      smsNotification,
    ]);

    expectToEqual(uow.outboxRepository.events, [
      {
        id: "email-event",
        topic: "NotificationAdded",
        payload: { id: "email-notification", kind: "email" },
        priority: 5,
        occurredAt: now.toISOString(),
        publications: [],
        status: "never-published",
        wasQuarantined: false,
      },
      {
        id: "sms-event",
        topic: "NotificationAdded",
        payload: { id: "sms-notification", kind: "sms" },
        priority: 5,
        occurredAt: now.toISOString(),
        publications: [],
        status: "never-published",
        wasQuarantined: false,
      },
    ]);
  });

  it("applies an explicit priority to every event", async () => {
    uuidGenerator.setNextUuids([
      "notification-1",
      "notification-2",
      "event-1",
      "event-2",
    ]);
    const saveNotificationsBatchAndRelatedEvent =
      makeSaveNotificationsBatchAndRelatedEvent(
        uuidGenerator,
        new CustomTimeGateway(now),
      );

    await saveNotificationsBatchAndRelatedEvent(
      uow,
      [emailNotification("recipient@example.com"), smsNotification],
      { priority: 8 },
    );

    expectToEqual(uow.outboxRepository.events, [
      {
        id: "event-1",
        topic: "NotificationAdded",
        payload: { id: "notification-1", kind: "email" },
        priority: 8,
        occurredAt: now.toISOString(),
        publications: [],
        status: "never-published",
        wasQuarantined: false,
      },
      {
        id: "event-2",
        topic: "NotificationAdded",
        payload: { id: "notification-2", kind: "sms" },
        priority: 8,
        occurredAt: now.toISOString(),
        publications: [],
        status: "never-published",
        wasQuarantined: false,
      },
    ]);
  });
});
