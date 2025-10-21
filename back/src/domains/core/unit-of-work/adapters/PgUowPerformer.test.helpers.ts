import type { Notification } from "shared";
import type { KyselyDb } from "../../../../config/pg/kysely/kyselyUtils";
import type { CreateNewEvent } from "../../events/ports/EventBus";
import type { UuidGenerator } from "../../uuid-generator/ports/UuidGenerator";
import type { UnitOfWork } from "../ports/UnitOfWork";

export const useCaseUnderTest =
  (
    createNewEvent: CreateNewEvent,
    uuidGenerator: UuidGenerator,
    shoudlThrow?: boolean,
  ) =>
  async (uow: UnitOfWork) => {
    const notification: Notification = {
      id: uuidGenerator.new(),
      createdAt: new Date().toISOString(),
      kind: "email",
      templatedContent: {
        kind: "TEST_EMAIL",
        params: { input1: "", input2: "", url: "http://" },
        recipients: ["a@a.com"],
      },
      followedIds: {},
    };

    await uow.notificationRepository.save(notification);
    await uow.outboxRepository.save(
      createNewEvent({
        topic: "NotificationAdded",
        payload: { id: notification.id, kind: notification.kind },
      }),
    );
    if (shoudlThrow) throw new Error("Usecase failed");
  };

export const expectLengthOfRepos = async ({
  expectedNotificationLength,
  expectedOutboxLength,
  db,
}: {
  expectedNotificationLength: number;
  expectedOutboxLength: number;
  db: KyselyDb;
}) => {
  expect(
    await db.selectFrom("notifications_email").selectAll().execute(),
  ).toHaveLength(expectedNotificationLength);

  expect(await db.selectFrom("outbox").selectAll().execute()).toHaveLength(
    expectedOutboxLength,
  );
};
