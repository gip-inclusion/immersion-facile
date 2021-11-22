import { getTestPgPool } from "../../_testBuilders/getTestPgPool";
import { createPgUow } from "../../adapters/primary/config";
import { PgUowPerformer } from "../../adapters/secondary/pg/PgUowPerformer";
import { FormEstablishmentDtoBuilder } from "../../_testBuilders/FormEstablishmentDtoBuilder";
import { Pool, PoolClient } from "pg";
import { makeCreateNewEvent } from "../../domain/core/eventBus/EventBus";
import { TestUuidGenerator } from "../../adapters/secondary/core/UuidGeneratorImplementations";
import { CustomClock } from "../../adapters/secondary/core/ClockImplementations";
import { UnitOfWork } from "../../domain/core/ports/UnitOfWork";

const someUuid = "11111111-1111-1111-1111-111111111111";

describe("PgUowPerformer", () => {
  let pool: Pool;
  let client: PoolClient;
  const uuidGenerator = new TestUuidGenerator();
  const createNewEvent = makeCreateNewEvent({
    uuidGenerator,
    clock: new CustomClock(),
  });
  let pgUowPerformer: PgUowPerformer;

  beforeAll(async () => {
    pool = getTestPgPool();
    client = await pool.connect();
  });

  beforeEach(async () => {
    await client.query("TRUNCATE form_establishments");
    await client.query("TRUNCATE outbox");
    pgUowPerformer = new PgUowPerformer(pool, createPgUow);
  });

  afterAll(async () => {
    client.release();
    await pool.end();
  });

  it("saves every thing when all goes fine", async () => {
    uuidGenerator.setNextUuid(someUuid);

    const savedUuid = await pgUowPerformer.perform(useCaseUnderTest);
    expect(savedUuid).toBe(someUuid);

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
      .withId(someUuid)
      .build();

    const uuid = await uow.formEstablishmentRepo.save(formEstablishment)!;

    const event = createNewEvent({
      topic: "FormEstablishmentAdded",
      payload: formEstablishment,
    });
    await uow.outboxRepo.save(event);
    return uuid;
  };

  const expectLengthOfRepos = async ({
    formEstablishmentLength,
    outboxLength,
  }: {
    formEstablishmentLength: number;
    outboxLength: number;
  }) => {
    const { rows: formEstablishments } = await client.query(
      "SELECT * FROM form_establishments",
    );
    expect(formEstablishments).toHaveLength(formEstablishmentLength);

    const { rows: outbox } = await client.query("SELECT * FROM outbox");
    expect(outbox).toHaveLength(outboxLength);
  };
});
