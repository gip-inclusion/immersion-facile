import { Pool } from "pg";
import { FormEstablishmentDtoBuilder } from "shared";
import {
  KyselyDb,
  makeKyselyDb,
} from "../../../../config/pg/kysely/kyselyUtils";
import { getTestPgPool } from "../../../../config/pg/pgUtils";
import { makeCreateNewEvent } from "../../events/ports/EventBus";
import { CustomTimeGateway } from "../../time-gateway/adapters/CustomTimeGateway";
import { TestUuidGenerator } from "../../uuid-generator/adapters/UuidGeneratorImplementations";
import { UnitOfWork } from "../ports/UnitOfWork";
import { PgUowPerformer } from "./PgUowPerformer";
import { createPgUow } from "./createPgUow";

const someSiret = "12345678901234";

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
    await db.deleteFrom("form_establishments").execute();
    await db.deleteFrom("outbox_failures").execute();
    await db.deleteFrom("outbox_publications").execute();
    await db.deleteFrom("outbox").execute();
  });

  afterAll(async () => {
    await pool.end();
  });

  it("saves everything when all goes fine", async () => {
    uuidGenerator.setNextUuid("11111111-1111-1111-1111-111111111111");
    await pgUowPerformer.perform(useCaseUnderTest);
    await expectLengthOfRepos({ formEstablishmentLength: 1, outboxLength: 1 });
  });

  it("keeps modifications atomic when something goes wrong", async () => {
    uuidGenerator.setNextUuid("a failing uuid");
    try {
      await pgUowPerformer.perform(useCaseUnderTest);
      expect("Should not be reached").toBe("");
    } catch (error: any) {
      expect(error.message).toBe(
        'invalid input syntax for type uuid: "a failing uuid"',
      );
    }

    await expectLengthOfRepos({ formEstablishmentLength: 0, outboxLength: 0 });
  });

  const useCaseUnderTest = async (uow: UnitOfWork) => {
    const formEstablishment = FormEstablishmentDtoBuilder.valid()
      .withSiret(someSiret)
      .build();

    await uow.formEstablishmentRepository.create(formEstablishment);

    const event = createNewEvent({
      topic: "FormEstablishmentAdded",
      payload: { formEstablishment, triggeredBy: null },
    });
    await uow.outboxRepository.save(event);
  };

  const expectLengthOfRepos = async ({
    formEstablishmentLength,
    outboxLength,
  }: {
    formEstablishmentLength: number;
    outboxLength: number;
  }) => {
    expect(
      await db.selectFrom("form_establishments").selectAll().execute(),
    ).toHaveLength(formEstablishmentLength);

    expect(await db.selectFrom("outbox").selectAll().execute()).toHaveLength(
      outboxLength,
    );
  };
});
