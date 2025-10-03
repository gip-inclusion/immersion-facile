import { Pool } from "pg";
import { expectPromiseToFailWithError, type Notification } from "shared";
import { v4 as uuid } from "uuid";
import { AppConfig } from "../../../../config/bootstrap/appConfig";
import {
  type KyselyDb,
  makeKyselyDb,
} from "../../../../config/pg/kysely/kyselyUtils";
import {
  type CreateNewEvent,
  makeCreateNewEvent,
} from "../../events/ports/EventBus";
import { CustomTimeGateway } from "../../time-gateway/adapters/CustomTimeGateway";
import { TestUuidGenerator } from "../../uuid-generator/adapters/UuidGeneratorImplementations";
import type { UuidGenerator } from "../../uuid-generator/ports/UuidGenerator";
import type { UnitOfWork } from "../ports/UnitOfWork";
import { createPgUow } from "./createPgUow";
import { PgUowPerformer } from "./PgUowPerformer";

describe("PgUowPerformer", () => {
  let pool: Pool;
  let db: KyselyDb;
  let pgUowPerformer: PgUowPerformer;
  let uuidGenerator: TestUuidGenerator;
  let createNewEvent: CreateNewEvent;

  beforeAll(async () => {
    uuidGenerator = new TestUuidGenerator();
    const config = AppConfig.createFromEnv();
    pool = new Pool({
      connectionString: config.pgImmersionDbUrl,
      idle_in_transaction_session_timeout: 3_000,

      min: 2,
      max: 25,
    });
    db = makeKyselyDb(pool);
    pgUowPerformer = new PgUowPerformer(db, createPgUow);
    createNewEvent = makeCreateNewEvent({
      uuidGenerator,
      timeGateway: new CustomTimeGateway(),
    });
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

  describe("unit tests", () => {
    it("saves everything when all goes fine", async () => {
      uuidGenerator.setNextUuids([...Array(2)].map(() => uuid()));

      await pgUowPerformer.perform(
        useCaseUnderTest(createNewEvent, uuidGenerator),
      );
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
        pgUowPerformer.perform(useCaseUnderTest(createNewEvent, uuidGenerator)),
        new Error(`invalid input syntax for type uuid: "${id}"`),
      );

      await expectLengthOfRepos({
        notificationLength: 0,
        outboxLength: 0,
        db,
      });
    });
  });

  describe("stress test", () => {
    const numberOfParallelTransactions = 10000;
    const timeoutInMs = 10_000;
    it(
      `try ${numberOfParallelTransactions} parallel transactions through max ${timeoutInMs}ms.`,
      async () => {
        uuidGenerator.setNextUuids(
          [...Array(2 * numberOfParallelTransactions)].map(() => uuid()),
        );
        await Promise.all(
          [...Array(numberOfParallelTransactions)].map(() =>
            pgUowPerformer.perform(
              useCaseUnderTest(createNewEvent, uuidGenerator),
            ),
          ),
        );

        await expectLengthOfRepos({
          notificationLength: numberOfParallelTransactions,
          outboxLength: numberOfParallelTransactions,
          db,
        });
      },
      timeoutInMs,
    );
  });

  const useCaseUnderTest =
    (createNewEvent: CreateNewEvent, uuidGenerator: UuidGenerator) =>
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
});
