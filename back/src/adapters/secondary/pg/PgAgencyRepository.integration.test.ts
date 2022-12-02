import { Pool, PoolClient } from "pg";
import {
  activeAgencyStatuses,
  AgencyDto,
  AgencyDtoBuilder,
  GeoPositionDto,
  expectTypeToMatchAndEqual,
} from "shared";
import { getTestPgPool } from "../../../_testBuilders/getTestPgPool";

import { PgAgencyRepository } from "./PgAgencyRepository";

const agency1builder = AgencyDtoBuilder.create(
  "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
)
  .withName("agency1")
  .withKind("pole-emploi")
  .withAddress({
    streetNumberAndAddress: "Agency 1 address",
    city: "Paris",
    postcode: "75001",
    departmentCode: "75",
  })
  .withCounsellorEmails(["counsellorA@agency1.fr", "counsellorB@agency1.fr"])
  .withValidatorEmails(["validatorA@agency1.fr", "validatorB@agency1.fr"])
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
  .withCounsellorEmails(["counsellorA@agency2.fr", "counsellorB@agency2.fr"])
  .withValidatorEmails([]) // no validators
  .withAdminEmails(["adminA@agency2.fr", "adminB@agency2.fr"])
  .withQuestionnaireUrl("http://questionnaire.agency2.fr")
  .withSignature("The team of agency2");

const inactiveAgency = AgencyDtoBuilder.create(
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
    await client.query("DELETE FROM conventions");
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
      const agency = await agencyRepository.getImmersionFacileAgencyId();
      expect(agency).toBeUndefined();
    });
  });

  describe("getAgencies", () => {
    // TODO Casser le découplage

    const agency1PE = agency1builder.withKind("pole-emploi").build();
    const agency2MissionLocale = agency2builder
      .withKind("mission-locale")
      .build();
    const agencyAddedFromPeReferenciel = agency1builder
      .withId("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee")
      .withName("Agency from PE referenciel")
      .withStatus("from-api-PE")
      .build();

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

    it("returns empty list for empty table", async () => {
      const agencies = await agencyRepository.getAgencies({});
      expect(agencies).toEqual([]);
    });

    it("returns all agencies filtered on statuses", async () => {
      await Promise.all([
        agencyRepository.insert(agency1PE),
        agencyRepository.insert(agency2MissionLocale),
        agencyRepository.insert(agencyAddedFromPeReferenciel),
        agencyRepository.insert(inactiveAgency),
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
        agencyRepository.insert(agency1PE),
        agencyRepository.insert(agency2MissionLocale),
        agencyRepository.insert(agencyAddedFromPeReferenciel),
        agencyRepository.insert(inactiveAgency),
      ]);

      const agencies = await agencyRepository.getAgencies({
        filters: {
          position: { position: { lat: 0, lon: 0 }, distance_km: 10 },
        },
        limit: 2,
      });
      expect(sortById(agencies)).toEqual([agency2MissionLocale, agency1PE]);
    });
    it("if agencyKindFilter = 'peOnly', returns only pe agencies", async () => {
      await Promise.all([
        agencyRepository.insert(agency1PE),
        agencyRepository.insert(agency2MissionLocale),
      ]);

      const agencies = await agencyRepository.getAgencies({
        filters: { kind: "peOnly" },
      });
      expect(sortById(agencies)).toEqual([agency1PE]);
    });
    it("if agencyKindFilter = 'cciOnly', returns only cci agencies", async () => {
      await Promise.all([
        agencyRepository.insert(agencyCciInParis),
        agencyRepository.insert(agency1PE),
      ]);

      const agencies = await agencyRepository.getAgencies({
        filters: { kind: "cciOnly" },
      });
      expect(sortById(agencies)).toEqual([agencyCciInParis]);
    });
    it("if agencyKindFilter = 'cciExcluded', returns agencies that are not kind cci", async () => {
      await Promise.all([
        agencyRepository.insert(agencyCciInParis),
        agencyRepository.insert(agency1PE),
      ]);

      const agencies = await agencyRepository.getAgencies({
        filters: { kind: "cciExcluded" },
      });
      expect(sortById(agencies)).toEqual([agency1PE]);
    });

    it("returns all agencies filtered by name", async () => {
      await Promise.all([
        agencyRepository.insert(agenciesByName[0]),
        agencyRepository.insert(agenciesByName[1]),
        agencyRepository.insert(agenciesByName[2]),
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
        agencyRepository.insert(agenciesByName[0]),
        agencyRepository.insert(agenciesByName[1]),
        agencyRepository.insert(agenciesByName[2]),
        agencyRepository.insert(agencyCciInParis),
      ]);
      const agencies = await agencyRepository.getAgencies({
        filters: { departmentCode: "75" },
      });
      expect(sortById(agencies)).toEqual([agencyCciInParis]);
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

      const epinalAgency = agency2builder
        .withName("Epinal agency")
        .withPosition(48.179552, 6.441447)
        .build();

      const dijonAgency = AgencyDtoBuilder.create(
        "33333333-3333-3333-3333-333333333333",
      )
        .withName("Dijon agency")
        .withPosition(47.365086, 5.051027)
        .build();

      await Promise.all([
        agencyRepository.insert(nancyAgency),
        agencyRepository.insert(epinalAgency),
        agencyRepository.insert(dijonAgency),
        agencyRepository.insert(inactiveAgency),
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

    it("if agencyKindFilter is 'peOnly', it returns only agencies of pe kind", async () => {
      const peNancyAgency = agency1builder
        .withName("Nancy PE agency")
        .withKind("pole-emploi")
        .withPosition(placeStanislasPosition.lat, placeStanislasPosition.lon)
        .withStatus("active")
        .build();

      const capEmploiNancyAgency = agency2builder
        .withName("Nancy CAP EMPLOI agency")
        .withKind("cap-emploi")
        .withPosition(placeStanislasPosition.lat, placeStanislasPosition.lon)
        .withStatus("active")
        .build();

      await Promise.all([
        agencyRepository.insert(peNancyAgency),
        agencyRepository.insert(capEmploiNancyAgency),
      ]);

      // Act
      const agencies = await agencyRepository.getAgencies({
        filters: {
          position: {
            position: placeStanislasPosition,
            distance_km: 100,
          },
          kind: "peOnly",
        },
      });

      // Assert
      expect(agencies).toEqual([peNancyAgency]);
    });
    it("if agencyKindFilter is 'peExcluded', it returns all agencies except those from PE", async () => {
      const peNancyAgency = agency1builder
        .withName("Nancy PE agency")
        .withKind("pole-emploi")
        .withPosition(placeStanislasPosition.lat, placeStanislasPosition.lon)
        .withStatus("active")
        .build();

      const capEmploiNancyAgency = agency2builder
        .withName("Nancy CAP EMPLOI agency")
        .withKind("cap-emploi")
        .withPosition(placeStanislasPosition.lat, placeStanislasPosition.lon)
        .withStatus("active")
        .build();

      await Promise.all([
        agencyRepository.insert(peNancyAgency),
        agencyRepository.insert(capEmploiNancyAgency),
      ]);

      // Act
      const agencies = await agencyRepository.getAgencies({
        filters: {
          position: {
            position: placeStanislasPosition,
            distance_km: 100,
          },
          kind: "peExcluded",
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
          postcode: "",
          streetNumberAndAddress: "",
        })
        .build();

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

      await Promise.all([
        agencyRepository.insert(parisAgency),
        agencyRepository.insert(cergyAgency),
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
    beforeEach(() => {
      agency1 = agency1builder
        .withAgencySiret("11110000111100")
        .withCodeSafir("123")
        .build();
      agency2 = agency2builder.build();
    });
    it("inserts unknown entities", async () => {
      expect(await agencyRepository.getAgencies({})).toHaveLength(0);

      await agencyRepository.insert(agency1);
      const allActiveAgencies = await agencyRepository.getAgencies({});
      expect(allActiveAgencies).toHaveLength(1);
      expect(allActiveAgencies[0]).toEqual(agency1);

      await agencyRepository.insert(agency2);
      expect(await agencyRepository.getAgencies({})).toHaveLength(2);
    });
  });

  describe("update", () => {
    const agency1 = agency1builder
      .withPosition(40, 2)
      .withStatus("needsReview")
      .build();

    it("updates the entire entity", async () => {
      expect(await agencyRepository.getAgencies({})).toHaveLength(0);

      await agencyRepository.insert(agency1);
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

      await agencyRepository.update(updatedAgency1);
      const inDb = await agencyRepository.getAgencies({});
      expect(inDb).toHaveLength(1);
      expectTypeToMatchAndEqual(inDb[0], updatedAgency1);
    });
    it("updates the only some fields", async () => {
      expect(await agencyRepository.getAgencies({})).toHaveLength(0);

      await agencyRepository.insert(agency1);
      expect(await agencyRepository.getAgencies({})).toHaveLength(1);

      await agencyRepository.update({
        id: agency1.id,
        status: "active",
      });
      const inDb = await agencyRepository.getAgencies({});
      expect(inDb).toHaveLength(1);
      expectTypeToMatchAndEqual(inDb[0], { ...agency1, status: "active" });
    });
  });

  it("doesn't insert entities with existing ids", async () => {
    const agency1a = agency1builder.withName("agency1a").build();

    const agency1b = agency1builder.withName("agency1b").build();

    expect(await agencyRepository.getAgencies({})).toHaveLength(0);

    await agencyRepository.insert(agency1a);
    expect(await agencyRepository.getAgencies({})).toHaveLength(1);

    const id1b = await agencyRepository.insert(agency1b);
    expect(id1b).toBeUndefined();

    const storedAgency = await agencyRepository.getById(agency1a.id);
    expect(storedAgency?.name).toEqual(agency1a.name);
  });
});

const sortById = (agencies: AgencyDto[]): AgencyDto[] =>
  [...agencies].sort((a, b) => (a.id < b.id ? -1 : 1));
