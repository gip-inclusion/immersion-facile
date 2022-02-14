import { Pool, PoolClient } from "pg";
import { PgAgencyRepository } from "../../adapters/secondary/pg/PgAgencyRepository";
import { AgencyConfig } from "../../domain/immersionApplication/ports/AgencyRepository";
import { getTestPgPool } from "../../_testBuilders/getTestPgPool";
import { AgencyConfigBuilder } from "../../_testBuilders/AgencyConfigBuilder";
import { LatLonDto } from "../../shared/SearchImmersionDto";

const agency1builder = AgencyConfigBuilder.create(
  "11111111-1111-1111-1111-111111111111",
)
  .withName("agency1")
  .withAddress("Agency 1 address")
  .withCounsellorEmails(["counsellorA@agency1.fr", "counsellorB@agency1.fr"])
  .withValidatorEmails(["validatorA@agency1.fr", "validatorB@agency1.fr"])
  .withAdminEmails(["adminA@agency1.fr", "adminB@agency1.fr"])
  .withQuestionnaireUrl("http://questionnaire.agency1.fr")
  .withSignature("The team of agency1");

const agency2builder = AgencyConfigBuilder.create(
  "22222222-2222-2222-2222-222222222222",
)
  .withName("agency2")
  .withAddress("Agency 2 address")
  .withCounsellorEmails(["counsellorA@agency2.fr", "counsellorB@agency2.fr"])
  .withValidatorEmails([]) // no validators
  .withAdminEmails(["adminA@agency2.fr", "adminB@agency2.fr"])
  .withQuestionnaireUrl("http://questionnaire.agency2.fr")
  .withSignature("The team of agency2");

describe("PgAgencyRepository", () => {
  let pool: Pool;
  let client: PoolClient;
  let agencyRepository: PgAgencyRepository;

  beforeAll(async () => {
    pool = getTestPgPool();
    client = await pool.connect();
  });

  afterAll(async () => {
    client.release();
    await pool.end();
  });

  beforeEach(async () => {
    await client.query("TRUNCATE agencies");
    agencyRepository = new PgAgencyRepository(client);
  });

  describe("getById", () => {
    const agency1 = agency1builder.build();

    it("returns existing agency", async () => {
      console.log("agency1 : ", agency1);
      await agencyRepository.insert(agency1);

      const config = await agencyRepository.getById(agency1.id);
      expect(config).toEqual(agency1);
    });

    it("returns undefined for missing agency", async () => {
      const config = await agencyRepository.getById(agency1.id);
      expect(config).toBeUndefined();
    });
  });

  describe("getAll", () => {
    let agency1: AgencyConfig;
    let agency2: AgencyConfig;
    beforeEach(() => {
      agency1 = agency1builder.build();
      agency2 = agency2builder.build();
    });

    it("returns empty list for empty table", async () => {
      const configs = await agencyRepository.getAll();
      expect(configs).toEqual([]);
    });
    it("returns all agencies", async () => {
      await agencyRepository.insert(agency1);
      await agencyRepository.insert(agency2);

      const configs = await agencyRepository.getAll();
      expect(sortById(configs)).toEqual([agency1, agency2]);
    });
  });

  describe("getNearby", () => {
    it("returns only agencies which are less than certain distance", async () => {
      const nancyAgency = agency1builder
        .withName("Nancy agency")
        .withPosition(48.697851, 6.20157)
        .build();

      const epinalAgency = agency2builder
        .withName("Epinal agency")
        .withPosition(48.179552, 6.441447)
        .build();

      const dijonAgency = AgencyConfigBuilder.create(
        "33333333-3333-3333-3333-333333333333",
      )
        .withName("Dijon agency")
        .withPosition(47.365086, 5.051027)
        .build();

      const placeStanislasPosition: LatLonDto = {
        lat: 48.693339,
        lon: 6.182858,
      };

      await Promise.all([
        agencyRepository.insert(nancyAgency),
        agencyRepository.insert(epinalAgency),
        agencyRepository.insert(dijonAgency),
      ]);

      // Act
      const configs = await agencyRepository.getNearby(placeStanislasPosition);

      // Assert
      expect(configs).toEqual([nancyAgency, epinalAgency]);
    });
  });

  describe("insert", () => {
    let agency1: AgencyConfig;
    let agency2: AgencyConfig;
    beforeEach(() => {
      agency1 = agency1builder.build();
      agency2 = agency2builder.build();
    });
    it("inserts unknown entities", async () => {
      expect(await agencyRepository.getAll()).toHaveLength(0);

      await agencyRepository.insert(agency1);
      expect(await agencyRepository.getAll()).toHaveLength(1);

      await agencyRepository.insert(agency2);
      expect(await agencyRepository.getAll()).toHaveLength(2);
    });
  });

  it("doesn't insert entities with existing ids", async () => {
    const agency1a = agency1builder.withName("agency1a").build();

    const agency1b = agency1builder.withName("agency1b").build();

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
  [...configs].sort((a, b) => (a.id < b.id ? -1 : 1));
