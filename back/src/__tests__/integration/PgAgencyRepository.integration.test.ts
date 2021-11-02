import { Pool, PoolClient } from "pg";
import { PgAgencyRepository } from "../../adapters/secondary/pg/PgAgencyRepository";
import { AgencyConfig } from "../../domain/immersionApplication/ports/AgencyRepository";
import { getTestPgPool } from "../../_testBuilders/getTestPgPool";
import { AgencyConfigBuilder } from "./../../_testBuilders/AgencyConfigBuilder";

const agency1 = AgencyConfigBuilder.empty()
  .withId("11111111-1111-1111-1111-111111111111")
  .withName("agency1")
  .withCounsellorEmails(["counsellorA@agency1.fr", "counsellorB@agency1.fr"])
  .withValidatorEmails(["validatorA@agency1.fr", "validatorB@agency1.fr"])
  .withAdminEmails(["adminA@agency1.fr", "adminB@agency1.fr"])
  .withQuestionnaireUrl("http://questionnaire.agency1.fr")
  .withSignature("The team of agency1")
  .build();
const agency2 = AgencyConfigBuilder.empty()
  .withId("22222222-2222-2222-2222-222222222222")
  .withName("agency2")
  .withCounsellorEmails(["counsellorA@agency2.fr", "counsellorB@agency2.fr"])
  .withValidatorEmails([]) // no validators
  .withAdminEmails(["adminA@agency2.fr", "adminB@agency2.fr"])
  .withQuestionnaireUrl("http://questionnaire.agency2.fr")
  .withSignature("The team of agency2")
  .build();

describe("PgAgencyRepository", () => {
  let pool: Pool;
  let client: PoolClient;
  let agencyRepository: PgAgencyRepository;

  beforeAll(async () => {
    pool = pool = getTestPgPool();
    client = await pool.connect();
  });

  afterAll(() => {
    client.release();
  });

  beforeEach(async () => {
    await client.query("TRUNCATE agencies");
    agencyRepository = new PgAgencyRepository(client);
  });

  describe("getById", () => {
    test("returns existing agency", async () => {
      await agencyRepository.insert(agency1);

      const config = await agencyRepository.getById(agency1.id);
      expect(config).toEqual(agency1);
    });

    test("returns undefined for missing agency", async () => {
      const config = await agencyRepository.getById(agency1.id);
      expect(config).toBeUndefined();
    });
  });

  describe("getAll", () => {
    test("returns empty list for empty table", async () => {
      const configs = await agencyRepository.getAll();
      expect(configs).toEqual([]);
    });
    test("returns all agencies", async () => {
      await agencyRepository.insert(agency1);
      await agencyRepository.insert(agency2);

      const configs = await agencyRepository.getAll();
      expect(sortById(configs)).toEqual([agency1, agency2]);
    });
  });

  describe("insert", () => {
    test("inserts unknown entities", async () => {
      expect(await agencyRepository.getAll()).toHaveLength(0);

      await agencyRepository.insert(agency1);
      expect(await agencyRepository.getAll()).toHaveLength(1);

      await agencyRepository.insert(agency2);
      expect(await agencyRepository.getAll()).toHaveLength(2);
    });
  });

  test("doesn't insert entities with existing ids", async () => {
    const agency1a = AgencyConfigBuilder.empty()
      .withId(agency1.id)
      .withName("agency1a")
      .build();

    const agency1b = new AgencyConfigBuilder(agency1)
      .withId(agency1.id)
      .withName("agency1b")
      .build();

    expect(await agencyRepository.getAll()).toHaveLength(0);

    await agencyRepository.insert(agency1a);
    expect(await agencyRepository.getAll()).toHaveLength(1);

    const id1b = await agencyRepository.insert(agency1b);
    expect(id1b).toBeUndefined();

    const storedAgency = await agencyRepository.getById(agency1a.id);
    expect(storedAgency?.name).toEqual(agency1a.name);
  });
});

const sortById = (configs: AgencyConfig[]): AgencyConfig[] =>
  configs.sort((a, b) => (a.id < b.id ? -1 : 1));
