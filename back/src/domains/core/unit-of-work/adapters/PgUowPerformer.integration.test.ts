import type { Pool } from "pg";
import { expectPromiseToFailWithError, type Notification } from "shared";
import {
  type KyselyDb,
  makeKyselyDb,
} from "../../../../config/pg/kysely/kyselyUtils";
import { getTestPgPool } from "../../../../config/pg/pgUtils";
import {
  type CreateNewEvent,
  makeCreateNewEvent,
} from "../../events/ports/EventBus";
import { CustomTimeGateway } from "../../time-gateway/adapters/CustomTimeGateway";
import { TestUuidGenerator } from "../../uuid-generator/adapters/UuidGeneratorImplementations";
import type { UnitOfWork } from "../ports/UnitOfWork";
import { createPgUow } from "./createPgUow";
import { PgUowPerformer } from "./PgUowPerformer";

describe("PgUowPerformer", () => {
  let pool: Pool;
  let db: KyselyDb;
  let pgUowPerformer: PgUowPerformer;

  const uuidGenerator = new TestUuidGenerator();
  const createNewEvent = makeCreateNewEvent({
    uuidGenerator,
    timeGateway: new CustomTimeGateway(),
  });

  beforeAll(async () => {
    pool = getTestPgPool();
    db = makeKyselyDb(pool);
    pgUowPerformer = new PgUowPerformer(db, createPgUow);
  });

  beforeEach(async () => {
    await db.deleteFrom("notifications_email_attachments").execute();
    await db.deleteFrom("notifications_email_recipients").execute();
    await db.deleteFrom("notifications_email").execute();
    await db.deleteFrom("outbox_failures").execute();
    await db.deleteFrom("outbox_publications").execute();
    await db.deleteFrom("outbox").execute();
  });

  afterAll(async () => {
    await pool.end();
  });

  it("saves everything when all goes fine", async () => {
    uuidGenerator.setNextUuid("11111111-1111-1111-1111-111111111111");

    await pgUowPerformer.perform(useCaseUnderTest(createNewEvent));
    await expectLengthOfRepos({
      notificationLength: 1,
      outboxLength: 1,
      db,
    });
  });

  it("keeps modifications atomic when something goes wrong", async () => {
    const id = "a failing uuid";
    uuidGenerator.setNextUuid(id);

    expectPromiseToFailWithError(
      pgUowPerformer.perform(useCaseUnderTest(createNewEvent)),
      new Error(`invalid input syntax for type uuid: "${id}"`),
    );

    await expectLengthOfRepos({
      notificationLength: 0,
      outboxLength: 0,
      db,
    });
  });
});

const useCaseUnderTest =
  (createNewEvent: CreateNewEvent) => async (uow: UnitOfWork) => {
    const notification: Notification = {
      id: "11111111-1111-1111-1111-111111111113",
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
  };

const expectLengthOfRepos = async ({
  notificationLength,
  outboxLength,
  db,
}: {
  notificationLength: number;
  outboxLength: number;
  db: KyselyDb;
}) => {
  expect(
    await db.selectFrom("notifications_email").selectAll().execute(),
  ).toHaveLength(notificationLength);

  expect(await db.selectFrom("outbox").selectAll().execute()).toHaveLength(
    outboxLength,
  );
};
