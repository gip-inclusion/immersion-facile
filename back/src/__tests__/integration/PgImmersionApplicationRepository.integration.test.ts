import { Pool, PoolClient } from "pg";
import { AgencyBuilder } from "shared/src/agency/AgencyBuilder";
import { PgAgencyRepository } from "../../adapters/secondary/pg/PgAgencyRepository";
import { PgImmersionApplicationRepository } from "../../adapters/secondary/pg/PgImmersionApplicationRepository";
import { ImmersionApplicationEntity } from "../../domain/immersionApplication/entities/ImmersionApplicationEntity";
import { ImmersionApplicationId } from "shared/src/ImmersionApplication/ImmersionApplication.dto";
import { getTestPgPool } from "../../_testBuilders/getTestPgPool";
import { ImmersionApplicationEntityBuilder } from "../../_testBuilders/ImmersionApplicationEntityBuilder";
import { ImmersionApplicationDtoBuilder } from "shared/src/ImmersionApplication/ImmersionApplicationDtoBuilder";

describe("PgImmersionApplicationRepository", () => {
  let pool: Pool;
  let client: PoolClient;
  let immersionApplicationRepository: PgImmersionApplicationRepository;

  beforeAll(async () => {
    pool = getTestPgPool();
    client = await pool.connect();
    const agencyRepository = new PgAgencyRepository(client);
    await agencyRepository.insert(AgencyBuilder.create().build());
  });

  afterAll(async () => {
    client.release();
    await pool.end();
  });

  beforeEach(async () => {
    await client.query("DELETE FROM immersion_applications");
    immersionApplicationRepository = new PgImmersionApplicationRepository(
      client,
    );
  });

  it("Adds a new ImmersionApplicationEntity", async () => {
    const immersionApplicationEntity = new ImmersionApplicationEntityBuilder()
      .withId("aaaaac99-9c0b-bbbb-bb6d-6bb9bd38aaaa")
      .build();
    await immersionApplicationRepository.save(immersionApplicationEntity);

    expect(
      await immersionApplicationRepository.getById(
        immersionApplicationEntity.id,
      ),
    ).toEqual(immersionApplicationEntity);
  });

  it("Adds a new ImmersionApplicationEntity with field workConditions undefined", async () => {
    const immersionApplicationEntity = new ImmersionApplicationEntityBuilder()
      .withoutWorkCondition()
      .build();

    await immersionApplicationRepository.save(immersionApplicationEntity);

    expect(
      await immersionApplicationRepository.getById(
        immersionApplicationEntity.id,
      ),
    ).toEqual(immersionApplicationEntity);
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

    expect(await immersionApplicationRepository.getById(idA)).toEqual(
      updatedImmersionApplicationEntity,
    );
  });
});
