import { Pool, PoolClient } from "pg";
import { AppConfigBuilder } from "../../_testBuilders/AppConfigBuilder";
import { PgImmersionApplicationRepository } from "../../adapters/secondary/pg/PgImmersionApplicationRepository";
import { ImmersionApplicationEntity } from "../../domain/immersionApplication/entities/ImmersionApplicationEntity";
import { ImmersionApplicationId } from "../../shared/ImmersionApplicationDto";
import { ImmersionApplicationDtoBuilder } from "../../_testBuilders/ImmersionApplicationDtoBuilder";
import { ImmersionApplicationEntityBuilder } from "../../_testBuilders/ImmersionApplicationEntityBuilder";
import { getTestPgPool } from "../../_testBuilders/getTestPgPool";

describe("PgImmersionApplicationRepository", () => {
  let pool: Pool;
  let client: PoolClient;
  let immersionApplicationRepository: PgImmersionApplicationRepository;

  beforeAll(async () => {
    pool = pool = getTestPgPool();
    client = await pool.connect();
  });

  beforeEach(async () => {
    await client.query("TRUNCATE immersion_applications");
    immersionApplicationRepository = new PgImmersionApplicationRepository(
      client,
    );
  });

  afterAll(() => {
    client.release();
  });

  it("Adds a new ImmersionApplicationEntity", async () => {
    const immersionApplicationEntity = new ImmersionApplicationEntityBuilder()
      .withId("aaaaac99-9c0b-bbbb-bb6d-6bb9bd38aaaa")
      .build();
    await immersionApplicationRepository.save(immersionApplicationEntity);

    const result = await client.query("SELECT * FROM immersion_applications");

    expect(immersionApplicationRepository.pgToEntity(result.rows[0])).toEqual(
      immersionApplicationEntity,
    );
  });

  it("Gets saved immersion", async () => {
    const idA: ImmersionApplicationId = "aaaaac99-9c0b-aaaa-aa6d-6bb9bd38aaaa";
    const immersionApplicationEntityA = new ImmersionApplicationEntityBuilder()
      .withId(idA)
      .build();

    const idB: ImmersionApplicationId = "bbbbbc99-9c0b-bbbb-bb6d-6bb9bd38bbbb";
    const immersionApplicationEntityB = new ImmersionApplicationEntityBuilder()
      .withId(idB)
      .build();

    await immersionApplicationRepository.save(immersionApplicationEntityA);
    await immersionApplicationRepository.save(immersionApplicationEntityB);

    const resultA = await immersionApplicationRepository.getById(idA);
    expect(resultA).toEqual(immersionApplicationEntityA);

    const resultAll = await immersionApplicationRepository.getAll();
    expect(resultAll).toEqual([
      immersionApplicationEntityA,
      immersionApplicationEntityB,
    ]);
  });

  it("Updates an already saved immersion", async () => {
    const idA: ImmersionApplicationId = "aaaaac99-9c0b-aaaa-aa6d-6bb9bd38aaaa";
    const immersionApplicationEntity = new ImmersionApplicationEntityBuilder()
      .withId(idA)
      .build();
    await immersionApplicationRepository.save(immersionApplicationEntity);

    const updatedImmersionApplicationEntity = ImmersionApplicationEntity.create(
      new ImmersionApplicationDtoBuilder()
        .withId(idA)
        .withStatus("VALIDATED")
        .withEmail("someUpdated@email.com")
        .withDateEnd("2021-01-20")
        .build(),
    );

    await immersionApplicationRepository.updateImmersionApplication(
      updatedImmersionApplicationEntity,
    );

    const result = await client.query("SELECT * FROM immersion_applications");
    expect(result.rows).toHaveLength(1);
    expect(immersionApplicationRepository.pgToEntity(result.rows[0])).toEqual(
      updatedImmersionApplicationEntity,
    );
  });
});
