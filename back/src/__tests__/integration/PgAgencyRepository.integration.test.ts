import { Pool, PoolClient } from "pg";
import { PgAgencyRepository } from "../../adapters/secondary/pg/PgAgencyRepository";
import { AgencyConfig } from "../../domain/immersionApplication/ports/AgencyRepository";
import { getTestPgPool } from "../../_testBuilders/getTestPgPool";
import { AgencyConfigBuilder } from "../../_testBuilders/AgencyConfigBuilder";
import { LatLonDto } from "../../shared/latLon";

const agency1builder = AgencyConfigBuilder.create(
  "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
)
  .withName("agency1")
  .withKind("pole-emploi")
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
  .withKind("mission-locale")
  .withAddress("Agency 2 address")
  .withCounsellorEmails(["counsellorA@agency2.fr", "counsellorB@agency2.fr"])
  .withValidatorEmails([]) // no validators
  .withAdminEmails(["adminA@agency2.fr", "adminB@agency2.fr"])
  .withQuestionnaireUrl("http://questionnaire.agency2.fr")
  .withSignature("The team of agency2");

const inactiveAgency = AgencyConfigBuilder.create(
  "55555555-5555-5555-5555-555555555555",
)
  .withStatus("needsReview")
  .withPosition(48.7, 6.2)
  .build();

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
    await client.query("DELETE FROM immersion_applications");
    await client.query("DELETE FROM agencies");
    agencyRepository = new PgAgencyRepository(client);
  });

  describe("getById", () => {
    const agency1 = agency1builder.build();

    it("returns existing agency", async () => {
      await agencyRepository.insert(agency1);

      const agency = await agencyRepository.getById(agency1.id);
      expect(agency).toEqual(agency1);
    });

    it("returns undefined for missing agency", async () => {
      const agency = await agencyRepository.getById(agency1.id);
      expect(agency).toBeUndefined();
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
      const agencies = await agencyRepository.getAllActive();
      expect(agencies).toEqual([]);
    });
    it("returns all agencies", async () => {
      await Promise.all([
        agencyRepository.insert(agency1),
        agencyRepository.insert(agency2),
        agencyRepository.insert(inactiveAgency),
      ]);

      const agencies = await agencyRepository.getAllActive();
      expect(sortById(agencies)).toEqual([agency2, agency1]);
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
        agencyRepository.insert(inactiveAgency),
      ]);

      // Act
      const agencies = await agencyRepository.getNearby(placeStanislasPosition);

      // Assert
      expect(agencies).toEqual([nancyAgency, epinalAgency]);
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
      expect(await agencyRepository.getAllActive()).toHaveLength(0);

      await agencyRepository.insert(agency1);
      expect(await agencyRepository.getAllActive()).toHaveLength(1);

      await agencyRepository.insert(agency2);
      expect(await agencyRepository.getAllActive()).toHaveLength(2);
    });
  });

  it("doesn't insert entities with existing ids", async () => {
    const agency1a = agency1builder.withName("agency1a").build();

    const agency1b = agency1builder.withName("agency1b").build();

    expect(await agencyRepository.getAllActive()).toHaveLength(0);

    await agencyRepository.insert(agency1a);
    expect(await agencyRepository.getAllActive()).toHaveLength(1);

    const id1b = await agencyRepository.insert(agency1b);
    expect(id1b).toBeUndefined();

    const storedAgency = await agencyRepository.getById(agency1a.id);
    expect(storedAgency?.name).toEqual(agency1a.name);
  });
});

const sortById = (agencies: AgencyConfig[]): AgencyConfig[] =>
  [...agencies].sort((a, b) => (a.id < b.id ? -1 : 1));
