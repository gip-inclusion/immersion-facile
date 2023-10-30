import { Pool, PoolClient } from "pg";
import {
  activeAgencyStatuses,
  AgencyDto,
  AgencyDtoBuilder,
  agencyDtoToSaveAgencyParams,
  expectToEqual,
  GeoPositionDto,
  SaveAgencyParams,
  toAgencyPublicDisplayDto,
} from "shared";
import { getTestPgPool } from "../../../../_testBuilders/getTestPgPool";
import { makeKyselyDb } from "../kysely/kyselyUtils";
import { PgAgencyRepository } from "./PgAgencyRepository";

const agency1builder = AgencyDtoBuilder.create(
  "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa",
)
  .withName("agency1")
  .withKind("pole-emploi")
  .withAddress({
    streetNumberAndAddress: "Agency 1 address",
    city: "Paris",
    postcode: "75001",
    departmentCode: "75",
  })
  .withCounsellorEmails(["counsellor1@agency1.fr", "counsellor2@agency1.fr"])
  .withValidatorEmails(["validator1@agency1.fr", "validator2@agency1.fr"])
  .withAdminEmails(["adminA@agency1.fr", "adminB@agency1.fr"])
  .withQuestionnaireUrl("http://questionnaire.agency1.fr")
  .withSignature("The team of agency1")
  .withLogoUrl("http://logo.agency1.fr");

const agency2builder = AgencyDtoBuilder.create(
  "22222222-2222-2222-2222-222222222222",
)
  .withName("agency2")
  .withKind("mission-locale")
  .withAddress({
    streetNumberAndAddress: "Agency 2 address",
    city: "Paris",
    postcode: "75001",
    departmentCode: "75",
  })
  .withCounsellorEmails(["counsellor1@agency2.fr", "counsellor2@agency2.fr"])
  .withValidatorEmails(["agency2@validator.com"]) // no validators
  .withAdminEmails(["admin1@agency2.fr", "admin2@agency2.fr"])
  .withQuestionnaireUrl("http://questionnaire.agency2.fr")
  .withSignature("The team of agency2");

const inactiveAgency = AgencyDtoBuilder.create(
  "55555555-5555-5555-5555-555555555555",
)
  .withStatus("needsReview")
  .withPosition(48.7, 6.2)
  .build();
const inactiveAgencySaveParams = agencyDtoToSaveAgencyParams(inactiveAgency);

const agency1 = agency1builder
  .withId("aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa")
  .withAgencySiret("01234567890123")
  .withCodeSafir("AAAAAA")
  .build();
const agency1SaveParams = agencyDtoToSaveAgencyParams(agency1);

const agencyWithRefersTo = agency2builder
  .withRefersToAgency(toAgencyPublicDisplayDto(agency1))
  .build();
const agencyWithRefersToSaveParams =
  agencyDtoToSaveAgencyParams(agencyWithRefersTo);

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
    await client.query("DELETE FROM conventions");
    await client.query("DELETE FROM agencies");
    agencyRepository = new PgAgencyRepository(makeKyselyDb(pool));
  });

  describe("getById", () => {
    it("returns undefined when no agency found", async () => {
      const retrievedAgency = await agencyRepository.getById(
        agency1SaveParams.id,
      );
      expect(retrievedAgency).toBeUndefined();
    });

    it("returns existing agency", async () => {
      await agencyRepository.insert(agency1SaveParams);

      const retrievedAgency = await agencyRepository.getById(
        agency1SaveParams.id,
      );
      expectToEqual(retrievedAgency, agency1);
    });

    it("returns existing agency, with link to a refering one if it exists", async () => {
      await agencyRepository.insert(agency1SaveParams);
      await agencyRepository.insert(agencyWithRefersToSaveParams);

      const retrievedAgency = await agencyRepository.getById(
        agencyWithRefersTo.id,
      );
      expectToEqual(retrievedAgency, agencyWithRefersTo);
    });
  });

  describe("getByIds", () => {
    it("returns existing agency", async () => {
      await agencyRepository.insert(agency1SaveParams);

      const agencies = await agencyRepository.getByIds([agency1.id]);
      expectToEqual(agencies, [agency1]);
    });

    it("returns all agencies matching ids", async () => {
      const agency2 = agency1builder
        .withId("bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb")
        .withAgencySiret("00000000000000")
        .withCodeSafir("BBBBBB")
        .build();
      const agency2SaveParams = agencyDtoToSaveAgencyParams(agency2);
      const agency3 = agency1builder
        .withId("cccccccc-cccc-4ccc-cccc-cccccccccccc")
        .withAgencySiret("11111111111111")
        .withCodeSafir("CCCCCC")
        .build();
      const agency3SaveParams = agencyDtoToSaveAgencyParams(agency3);

      await Promise.all([
        agencyRepository.insert(agency1SaveParams),
        agencyRepository.insert(agency2SaveParams),
        agencyRepository.insert(agency3SaveParams),
      ]);

      const agencies = await agencyRepository.getByIds([
        agency1.id,
        agency3.id,
      ]);
      expectToEqual(agencies, [agency3, agency1]);
    });

    it("returns empty array when no agencies are found", async () => {
      const agencies = await agencyRepository.getByIds([agency1.id]);
      expectToEqual(agencies, []);
    });
  });

  describe("getImmersionFacileIdByKind", () => {
    it("returns undefined for missing agency", async () => {
      const agency = await agencyRepository.getImmersionFacileAgencyId();
      expect(agency).toBeUndefined();
    });
  });

  describe("getAgencies", () => {
    // TODO Casser le découplage

    const agency1PE = agency1builder.withKind("pole-emploi").build();
    const agency1PESaveParams = agencyDtoToSaveAgencyParams(agency1PE);
    const agency2MissionLocale = agency2builder
      .withKind("mission-locale")
      .build();
    const agency2MissionLocaleSaveParams =
      agencyDtoToSaveAgencyParams(agency2MissionLocale);
    const agencyAddedFromPeReferenciel = agency1builder
      .withId("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee")
      .withName("Agency from PE referenciel")
      .withStatus("from-api-PE")
      .withPosition(48.8415502, 2.4019552)
      .build();
    const agencyAddedFromPeReferencielSaveParams = agencyDtoToSaveAgencyParams(
      agencyAddedFromPeReferenciel,
    );

    const agenciesByName = [
      AgencyDtoBuilder.empty()
        .withId("22222222-2222-2222-2222-222222222222")
        .withName("Agence Pôle emploi VITRY‐SUR‐SEINE")
        .build(),
      AgencyDtoBuilder.empty()
        .withId("33333333-3333-3333-3333-333333333333")
        .withName("Agence Pôle emploi VITRY-LE-FRANCOIS")
        .build(),
      AgencyDtoBuilder.empty()
        .withId("44444444-4444-4444-4444-444444444444")
        .withName("Agence Pôle emploi VITROLLES")
        .build(),
    ];
    const agenciesByNameSaveParams = agenciesByName.map(
      agencyDtoToSaveAgencyParams,
    );

    const agencyCciInParis = new AgencyDtoBuilder()
      .withId("55555555-5555-5555-5555-555555555555")
      .withKind("cci")
      .withAddress({
        departmentCode: "75",
        city: "Paris",
        postcode: "75001",
        streetNumberAndAddress: "OSEF",
      })
      .build();
    const agencyCciInParisSaveParams =
      agencyDtoToSaveAgencyParams(agencyCciInParis);

    it("returns empty list for empty table", async () => {
      const agencies = await agencyRepository.getAgencies({});
      expect(agencies).toEqual([]);
    });

    it("returns all agencies filtered on statuses", async () => {
      await Promise.all([
        agencyRepository.insert(agency1PESaveParams),
        agencyRepository.insert(agency2MissionLocaleSaveParams),
        agencyRepository.insert(agencyAddedFromPeReferencielSaveParams),
        agencyRepository.insert(inactiveAgencySaveParams),
      ]);

      const agencies = await agencyRepository.getAgencies({
        filters: { status: activeAgencyStatuses },
      });
      expect(sortById(agencies)).toEqual([
        agency2MissionLocale,
        agency1PE,
        agencyAddedFromPeReferenciel,
      ]);
    });

    it("returns all agencies filtered on statuses, respecting provided limit and position", async () => {
      await Promise.all([
        agencyRepository.insert(agency1PESaveParams),
        agencyRepository.insert(agency2MissionLocaleSaveParams),
        agencyRepository.insert(agencyAddedFromPeReferencielSaveParams),
        agencyRepository.insert(inactiveAgencySaveParams),
      ]);

      const agencies = await agencyRepository.getAgencies({
        filters: {
          position: {
            position: { lat: 48.866667, lon: 2.333333 },
            distance_km: 10,
          },
        },
        limit: 2,
      });
      expect(sortById(agencies)).toEqual([agency2MissionLocale, agency1PE]);
    });

    it("if agencyKindFilter = 'immersionPeOnly', returns only pe agencies", async () => {
      await Promise.all([
        agencyRepository.insert(agency1PESaveParams),
        agencyRepository.insert(agency2MissionLocaleSaveParams),
      ]);

      const agencies = await agencyRepository.getAgencies({
        filters: { kind: "immersionPeOnly" },
      });
      expect(sortById(agencies)).toEqual([agency1PE]);
    });

    it("if agencyKindFilter = 'miniStageOnly', returns only cci agencies", async () => {
      await Promise.all([
        agencyRepository.insert(agencyCciInParisSaveParams),
        agencyRepository.insert(agency1PESaveParams),
      ]);

      const agencies = await agencyRepository.getAgencies({
        filters: { kind: "miniStageOnly" },
      });
      expect(sortById(agencies)).toEqual([agencyCciInParis]);
    });

    it("if agencyKindFilter = 'miniStageExcluded', returns agencies that are not kind cci", async () => {
      await Promise.all([
        agencyRepository.insert(agencyCciInParisSaveParams),
        agencyRepository.insert(agency1PESaveParams),
      ]);

      const agencies = await agencyRepository.getAgencies({
        filters: { kind: "miniStageExcluded" },
      });
      expect(sortById(agencies)).toEqual([agency1PE]);
    });

    it("if agencyKindFilter = 'withoutRefersToAgency', returns agencies that have no refersToAgency", async () => {
      await Promise.all([
        agencyRepository.insert(agency1SaveParams),
        agencyRepository.insert(agencyWithRefersToSaveParams),
      ]);

      const agencies = await agencyRepository.getAgencies({
        filters: { kind: "withoutRefersToAgency" },
      });
      expect(sortById(agencies)).toEqual([agency1]);
    });

    it("returns all agencies filtered by name", async () => {
      await Promise.all([
        agencyRepository.insert(agenciesByNameSaveParams[0]),
        agencyRepository.insert(agenciesByNameSaveParams[1]),
        agencyRepository.insert(agenciesByNameSaveParams[2]),
      ]);
      const agencies = await agencyRepository.getAgencies({
        filters: { nameIncludes: "Vitry" },
      });
      expect(sortById(agencies)).toEqual([
        agenciesByName[0],
        agenciesByName[1],
      ]);
    });

    it("returns agencies filtered by departmentCode", async () => {
      await Promise.all([
        agencyRepository.insert(agenciesByNameSaveParams[0]),
        agencyRepository.insert(agenciesByNameSaveParams[1]),
        agencyRepository.insert(agenciesByNameSaveParams[2]),
        agencyRepository.insert(agencyCciInParisSaveParams),
      ]);
      const agencies = await agencyRepository.getAgencies({
        filters: { departmentCode: "75" },
      });
      expect(sortById(agencies)).toEqual([agencyCciInParis]);
    });
  });

  describe("getAgencyWithValidatorEmail", () => {
    const agency1 = agency1builder.build();
    const agency1SaveParams = agencyDtoToSaveAgencyParams(agency1);

    it("returns undefined for empty table", async () => {
      const result = await agencyRepository.getAgencyWhereEmailMatches(
        "notFound",
      );
      expect(result).toBeUndefined();
    });

    it("returns the first agency matching the validator email", async () => {
      const agencyWithMatchingValidator = agency2builder
        .withValidatorEmails(["matching.validator@mail.com"])
        .build();
      const agencyWithMatchingValidatorSaveParams = agencyDtoToSaveAgencyParams(
        agencyWithMatchingValidator,
      );

      await Promise.all([
        agencyRepository.insert(agency1SaveParams),
        agencyRepository.insert(agencyWithMatchingValidatorSaveParams),
      ]);

      const matched = await agencyRepository.getAgencyWhereEmailMatches(
        "matching.validator@mail.com",
      );
      expect(matched).toEqual(agencyWithMatchingValidator);
    });

    it("returns the first agency matching the counsellor email", async () => {
      const agencyWithMatchingCounsellor = agency2builder
        .withCounsellorEmails(["matching.counsellor@mail.com"])
        .build();
      const agencyWithMatchingCounsellorSaveParams =
        agencyDtoToSaveAgencyParams(agencyWithMatchingCounsellor);

      await Promise.all([
        agencyRepository.insert(agency1SaveParams),
        agencyRepository.insert(agencyWithMatchingCounsellorSaveParams),
      ]);

      const matched = await agencyRepository.getAgencyWhereEmailMatches(
        "matching.counsellor@mail.com",
      );
      expect(matched).toEqual(agencyWithMatchingCounsellor);
    });
  });

  describe("to get agencies near by a given location", () => {
    const placeStanislasPosition: GeoPositionDto = {
      lat: 48.693339,
      lon: 6.182858,
    };

    it("returns only active agencies which are less than certain distance", async () => {
      const nancyAgency = agency1builder
        .withName("Nancy agency")
        .withPosition(48.697851, 6.20157)
        .build();
      const nancyAgencySaveParams = agencyDtoToSaveAgencyParams(nancyAgency);

      const epinalAgency = agency2builder
        .withName("Epinal agency")
        .withPosition(48.179552, 6.441447)
        .build();
      const epinalAgencySaveParams = agencyDtoToSaveAgencyParams(epinalAgency);

      const dijonAgency = AgencyDtoBuilder.create(
        "33333333-3333-3333-3333-333333333333",
      )
        .withName("Dijon agency")
        .withPosition(47.365086, 5.051027)
        .build();
      const dijonAgencySaveParams = agencyDtoToSaveAgencyParams(dijonAgency);

      await Promise.all([
        agencyRepository.insert(nancyAgencySaveParams),
        agencyRepository.insert(epinalAgencySaveParams),
        agencyRepository.insert(dijonAgencySaveParams),
        agencyRepository.insert(inactiveAgencySaveParams),
      ]);

      // Act
      const agencies = await agencyRepository.getAgencies({
        filters: {
          position: {
            position: placeStanislasPosition,
            distance_km: 100,
          },
          status: activeAgencyStatuses,
        },
      });

      // Assert
      expect(agencies).toEqual([nancyAgency, epinalAgency]);
    });

    it("if agencyKindFilter is 'immersionPeOnly', it returns only agencies of pe kind", async () => {
      const peNancyAgency = agency1builder
        .withName("Nancy PE agency")
        .withKind("pole-emploi")
        .withPosition(placeStanislasPosition.lat, placeStanislasPosition.lon)
        .withStatus("active")
        .build();
      const peNancyAgencySaveParams =
        agencyDtoToSaveAgencyParams(peNancyAgency);

      const capEmploiNancyAgency = agency2builder
        .withName("Nancy CAP EMPLOI agency")
        .withKind("cap-emploi")
        .withPosition(placeStanislasPosition.lat, placeStanislasPosition.lon)
        .withStatus("active")
        .build();
      const capEmploiNancyAgencySaveParams =
        agencyDtoToSaveAgencyParams(capEmploiNancyAgency);

      await Promise.all([
        agencyRepository.insert(peNancyAgencySaveParams),
        agencyRepository.insert(capEmploiNancyAgencySaveParams),
      ]);

      // Act
      const agencies = await agencyRepository.getAgencies({
        filters: {
          position: {
            position: placeStanislasPosition,
            distance_km: 100,
          },
          kind: "immersionPeOnly",
        },
      });

      // Assert
      expect(agencies).toEqual([peNancyAgency]);
    });

    it("if agencyKindFilter is 'immersionWithoutPe', it returns all agencies except those from PE", async () => {
      const peNancyAgency = agency1builder
        .withName("Nancy PE agency")
        .withKind("pole-emploi")
        .withPosition(placeStanislasPosition.lat, placeStanislasPosition.lon)
        .withStatus("active")
        .build();
      const peNancyAgencySaveParams =
        agencyDtoToSaveAgencyParams(peNancyAgency);

      const capEmploiNancyAgency = agency2builder
        .withName("Nancy CAP EMPLOI agency")
        .withKind("cap-emploi")
        .withPosition(placeStanislasPosition.lat, placeStanislasPosition.lon)
        .withStatus("active")
        .build();
      const capEmploiNancyAgencySaveParams =
        agencyDtoToSaveAgencyParams(capEmploiNancyAgency);

      const cciAgency = agency1builder
        .withId("33333333-3333-3333-3333-333333333333")
        .withName("Nancy CAP EMPLOI agency")
        .withKind("cci")
        .withPosition(placeStanislasPosition.lat, placeStanislasPosition.lon)
        .withStatus("active")
        .build();
      const cciAgencySaveParams = agencyDtoToSaveAgencyParams(cciAgency);

      await Promise.all([
        agencyRepository.insert(peNancyAgencySaveParams),
        agencyRepository.insert(capEmploiNancyAgencySaveParams),
        agencyRepository.insert(cciAgencySaveParams),
      ]);

      // Act
      const agencies = await agencyRepository.getAgencies({
        filters: {
          position: {
            position: placeStanislasPosition,
            distance_km: 100,
          },
          kind: "immersionWithoutPe",
        },
      });

      // Assert
      expect(agencies).toEqual([capEmploiNancyAgency]);
    });
  });

  describe("to get agencies near by a given department", () => {
    it("returns only agencies in department", async () => {
      const cergyAgency = agency1builder
        .withId("11111111-1111-1111-1111-111111111111")
        .withName("Agency Val d'Oise")
        .withAddress({
          departmentCode: "95",
          city: "Cergy",
          postcode: "95000",
          streetNumberAndAddress: "",
        })
        .build();
      const cergyAgencySaveParams = agencyDtoToSaveAgencyParams(cergyAgency);

      const parisAgency = agency1builder
        .withId("11111111-1111-1111-1111-111211111112")
        .withName("Agency Val d'Oise")
        .withAddress({
          departmentCode: "75",
          city: "Paris",
          postcode: "",
          streetNumberAndAddress: "",
        })
        .build();
      const parisAgencySaveParams = agencyDtoToSaveAgencyParams(parisAgency);

      await Promise.all([
        agencyRepository.insert(parisAgencySaveParams),
        agencyRepository.insert(cergyAgencySaveParams),
      ]);

      // Act
      const agencies = await agencyRepository.getAgencies({
        filters: {
          departmentCode: "95",
        },
      });

      // Assert
      expect(agencies[0].address.departmentCode).toEqual(
        cergyAgency.address.departmentCode,
      );
    });
  });

  describe("insert", () => {
    let agency1: AgencyDto;
    let agency2: AgencyDto;
    let agency1SaveParams: SaveAgencyParams;
    let agency2SaveParams: SaveAgencyParams;
    beforeEach(() => {
      agency1 = agency1builder
        .withAgencySiret("11110000111100")
        .withCodeSafir("123")
        .build();
      agency2 = agency2builder.build();
      agency1SaveParams = agencyDtoToSaveAgencyParams(agency1);
      agency2SaveParams = agencyDtoToSaveAgencyParams(agency2);
    });

    it("inserts unknown entities", async () => {
      expect(await agencyRepository.getAgencies({})).toHaveLength(0);

      await agencyRepository.insert(agency1SaveParams);
      const allActiveAgencies = await agencyRepository.getAgencies({});
      expect(allActiveAgencies).toHaveLength(1);
      expect(allActiveAgencies[0]).toEqual(agency1);

      await agencyRepository.insert(agency2SaveParams);
      expect(await agencyRepository.getAgencies({})).toHaveLength(2);
    });
  });

  describe("update", () => {
    const agency1 = agency1builder
      .withPosition(40, 2)
      .withStatus("needsReview")
      .build();
    const agency1SaveParams = agencyDtoToSaveAgencyParams(agency1);

    it("updates the entire entity", async () => {
      expect(await agencyRepository.getAgencies({})).toHaveLength(0);

      await agencyRepository.insert(agency1SaveParams);
      expect(await agencyRepository.getAgencies({})).toHaveLength(1);

      const updatedAgency1 = agency1builder
        .withName("Updated agency")
        .withPosition(41, 3)
        .withValidatorEmails(["updated@mail.com"])
        .withAgencySiret("11110000111100")
        .withCodeSafir("CODE_123")
        .withAddress({
          streetNumberAndAddress: "My new adress",
          postcode: "64100",
          departmentCode: "64",
          city: "Bayonne",
        })
        .build();

      await agencyRepository.update(
        agencyDtoToSaveAgencyParams(updatedAgency1),
      );
      const inDb = await agencyRepository.getAgencies({});
      expect(inDb).toHaveLength(1);
      expectToEqual(inDb[0], updatedAgency1);
    });

    it("updates the only some fields", async () => {
      expect(await agencyRepository.getAgencies({})).toHaveLength(0);

      await agencyRepository.insert(agency1SaveParams);
      expect(await agencyRepository.getAgencies({})).toHaveLength(1);

      await agencyRepository.update({
        id: agency1.id,
        status: "active",
      });
      const inDb = await agencyRepository.getAgencies({});
      expect(inDb).toHaveLength(1);
      expectToEqual(inDb[0], { ...agency1, status: "active" });
    });
  });

  it("doesn't insert entities with existing ids", async () => {
    const agency1a = agency1builder.withName("agency1a").build();
    const agency1SaveParams = agencyDtoToSaveAgencyParams(agency1a);

    const agency1b = agency1builder.withName("agency1b").build();
    const agency1bSaveParams = agencyDtoToSaveAgencyParams(agency1b);

    expect(await agencyRepository.getAgencies({})).toHaveLength(0);

    await agencyRepository.insert(agency1SaveParams);
    expect(await agencyRepository.getAgencies({})).toHaveLength(1);

    const id1b = await agencyRepository.insert(agency1bSaveParams);
    expect(id1b).toBeUndefined();

    const [storedAgency] = await agencyRepository.getByIds([agency1a.id]);
    expect(storedAgency?.name).toEqual(agency1a.name);
  });
});

const sortById = (agencies: AgencyDto[]): AgencyDto[] =>
  [...agencies].sort((a, b) => (a.id < b.id ? -1 : 1));
