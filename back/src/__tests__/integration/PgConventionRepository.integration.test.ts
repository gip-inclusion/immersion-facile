import { Pool, PoolClient } from "pg";
import { AgencyDtoBuilder } from "shared/src/agency/AgencyDtoBuilder";
import { ConventionId } from "shared/src/convention/convention.dto";
import { ConventionDtoBuilder } from "shared/src/convention/ConventionDtoBuilder";
import { getTestPgPool } from "../../_testBuilders/getTestPgPool";
import { PgAgencyRepository } from "../../adapters/secondary/pg/PgAgencyRepository";
import { PgConventionRepository } from "../../adapters/secondary/pg/PgConventionRepository";

describe("PgConventionRepository", () => {
  let pool: Pool;
  let client: PoolClient;
  let conventionRepository: PgConventionRepository;

  beforeAll(async () => {
    pool = getTestPgPool();
    client = await pool.connect();
    const agencyRepository = new PgAgencyRepository(client);
    await agencyRepository.insert(AgencyDtoBuilder.create().build());
  });

  afterAll(async () => {
    client.release();
    await pool.end();
  });

  beforeEach(async () => {
    await client.query("DELETE FROM partners_pe_connect");
    await client.query("DELETE FROM conventions");
    await client.query(
      "TRUNCATE TABLE convention_external_ids RESTART IDENTITY;",
    );
    conventionRepository = new PgConventionRepository(client);
  });

  it("Adds a new convention", async () => {
    const convention = new ConventionDtoBuilder()
      .withId("aaaaac99-9c0b-bbbb-bb6d-6bb9bd38aaaa")
      .build();
    const { externalId, ...createConventionParams } = convention;

    const savedExternalId = await conventionRepository.save(
      createConventionParams,
    );

    expect(await conventionRepository.getById(convention.id)).toEqual({
      ...convention,
      externalId: savedExternalId,
    });
    expect(typeof savedExternalId).toBe("string");
  });

  it("Adds a new convention with field workConditions undefined and no signatories", async () => {
    const convention = new ConventionDtoBuilder()
      .withoutWorkCondition()
      .notSigned()
      .build();

    const externalId = await conventionRepository.save(convention);

    const fetchedConvention = await conventionRepository.getById(convention.id);
    expect(fetchedConvention).toEqual({
      ...convention,
      externalId,
    });
  });

  it("Retrieves federated identity if exists", async () => {
    const peConnectId = "bbbbac99-9c0b-bbbb-bb6d-6bb9bd38bbbb";
    const convention = new ConventionDtoBuilder()
      .withFederatedIdentity(`peConnect:${peConnectId}`)
      .build();

    await client.query(
      `INSERT INTO partners_pe_connect(user_pe_external_id, convention_id, firstname, lastname, email, type)
    VALUES('${peConnectId}', '${convention.id}', 'John', 'Doe', 'john@mail.com', 'PLACEMENT')`,
    );

    const externalId = await conventionRepository.save(convention);

    expect(await conventionRepository.getById(convention.id)).toEqual({
      ...convention,
      externalId,
    });
  });

  it("Updates an already saved immersion", async () => {
    const idA: ConventionId = "aaaaac99-9c0b-aaaa-aa6d-6bb9bd38aaaa";
    const convention = new ConventionDtoBuilder().withId(idA).build();
    const externalId = await conventionRepository.save(convention);

    const updatedConvention = new ConventionDtoBuilder()
      .withId(idA)
      .withExternalId(externalId)
      .withStatus("ACCEPTED_BY_VALIDATOR")
      .withBeneficiaryEmail("someUpdated@email.com")
      .withDateEnd(new Date("2021-01-20").toISOString())
      .build();

    await conventionRepository.update(updatedConvention);

    expect(await conventionRepository.getById(idA)).toEqual(updatedConvention);
  });
});
