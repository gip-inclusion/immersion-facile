import { Pool, PoolClient } from "pg";
import { expectTypeToMatchAndEqual } from "../../_testBuilders/test.helpers";
import { PgAgencyRepository } from "../../adapters/secondary/pg/PgAgencyRepository";
import { getTestPgPool } from "../../_testBuilders/getTestPgPool";
import { AgencyBuilder } from "shared/src/agency/AgencyBuilder";
import { Agency } from "shared/src/agency/agency.dto";
import { LatLonDto } from "shared/src/latLon";

const agency1builder = AgencyBuilder.create(
  "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
)
  .withName("agency1")
  .withKind("pole-emploi")
  .withAddress("Agency 1 address")
  .withCounsellorEmails(["counsellorA@agency1.fr", "counsellorB@agency1.fr"])
  .withValidatorEmails(["validatorA@agency1.fr", "validatorB@agency1.fr"])
  .withAdminEmails(["adminA@agency1.fr", "adminB@agency1.fr"])
  .withQuestionnaireUrl("http://questionnaire.agency1.fr")
  .withSignature("The team of agency1")
  .withLogoUrl("http://logo.agency1.fr");

const agency2builder = AgencyBuilder.create(
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

const inactiveAgency = AgencyBuilder.create(
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

  describe("getImmersionFacileIdByKind", () => {
    it("returns undefined for missing agency", async () => {
      const agency = await agencyRepository.getImmersionFacileIdByKind();
      expect(agency).toBeUndefined();
    });
  });

  describe("getAll", () => {
    let agency1: Agency;
    let agency2: Agency;
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

  describe("getAgencyWithValidatorEmail", () => {
    const agency1 = agency1builder.build();

    it("returns undefined for empty table", async () => {
      const result = await agencyRepository.getAgencyWhereEmailMatches(
        "notFound",
      );
      expect(result).toBeUndefined();
    });

    it("returns the first agency matching the validator email", async () => {
      const agencyWithMatchingValidator = agency2builder
        .withValidatorEmails(["matchingValidator@mail.com"])
        .build();

      await Promise.all([
        agencyRepository.insert(agency1),
        agencyRepository.insert(agencyWithMatchingValidator),
      ]);

      const matched = await agencyRepository.getAgencyWhereEmailMatches(
        "matchingValidator@mail.com",
      );
      expect(matched).toEqual(agencyWithMatchingValidator);
    });

    it("returns the first agency matching the counsellor email", async () => {
      const agencyWithMatchingCounsellor = agency2builder
        .withCounsellorEmails(["matchingCounsellor@mail.com"])
        .build();

      await Promise.all([
        agencyRepository.insert(agency1),
        agencyRepository.insert(agencyWithMatchingCounsellor),
      ]);

      const matched = await agencyRepository.getAgencyWhereEmailMatches(
        "matchingCounsellor@mail.com",
      );
      expect(matched).toEqual(agencyWithMatchingCounsellor);
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

      const dijonAgency = AgencyBuilder.create(
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
      const agencies = await agencyRepository.getNearby(
        placeStanislasPosition,
        100,
      );

      // Assert
      expect(agencies).toEqual([nancyAgency, epinalAgency]);
    });
  });

  describe("insert", () => {
    let agency1: Agency;
    let agency2: Agency;
    beforeEach(() => {
      agency1 = agency1builder.build();
      agency2 = agency2builder.build();
    });
    it("inserts unknown entities", async () => {
      expect(await agencyRepository.getAllActive()).toHaveLength(0);

      await agencyRepository.insert(agency1);
      const allActiveAgencies = await agencyRepository.getAllActive();
      expect(allActiveAgencies).toHaveLength(1);
      expect(allActiveAgencies[0]).toEqual(agency1);

      await agencyRepository.insert(agency2);
      expect(await agencyRepository.getAllActive()).toHaveLength(2);
    });
  });

  describe("update", () => {
    const agency1 = agency1builder.withPosition(40, 2).build();

    it("updates entities", async () => {
      expect(await agencyRepository.getAllActive()).toHaveLength(0);

      await agencyRepository.insert(agency1);
      expect(await agencyRepository.getAllActive()).toHaveLength(1);

      const updatedAgency1 = agency1builder
        .withName("Updated agency")
        .withPosition(41, 3)
        .withValidatorEmails(["updated@mail.com"])
        .withAgencySiret("11110000111100")
        .withCode("CODE_123")
        .build();

      await agencyRepository.update(updatedAgency1);
      const inDb = await agencyRepository.getAllActive();
      expect(inDb).toHaveLength(1);
      expectTypeToMatchAndEqual(inDb[0], updatedAgency1);
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

const sortById = (agencies: Agency[]): Agency[] =>
  [...agencies].sort((a, b) => (a.id < b.id ? -1 : 1));
