import { Pool } from "pg";
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
import { UuidV4Generator } from "../../uuid-generator/adapters/UuidGeneratorImplementations";
import { createPgUow } from "./createPgUow";
import { PgUowPerformer } from "./PgUowPerformer";
import {
  expectLengthOfRepos,
  useCaseUnderTest,
} from "./PgUowPerformer.test.helpers";

describe("PgUowPerformer stress test", () => {
  let pool: Pool;
  let db: KyselyDb;
  let pgUowPerformer: PgUowPerformer;
  let uuidGenerator: UuidV4Generator;
  let createNewEvent: CreateNewEvent;

  const numberOfParallelTransactions = 10_000;
  const timeoutInMs = 10_000;

  beforeAll(async () => {
    uuidGenerator = new UuidV4Generator();
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

  it(
    `try ${numberOfParallelTransactions} parallel transactions through max ${timeoutInMs}ms.`,
    async () => {
      await Promise.all(
        [...Array(numberOfParallelTransactions)].map(() =>
          pgUowPerformer.perform(
            useCaseUnderTest(createNewEvent, uuidGenerator),
          ),
        ),
      );

      await expectLengthOfRepos({
        expectedNotificationLength: numberOfParallelTransactions,
        expectedOutboxLength: numberOfParallelTransactions,
        db,
      });
    },
    timeoutInMs,
  );
});
