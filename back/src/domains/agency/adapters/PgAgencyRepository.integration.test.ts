import { Pool } from "pg";
import {
  AgencyDto,
  AgencyDtoBuilder,
  GeoPositionDto,
  WithAcquisition,
  activeAgencyStatuses,
  errors,
  expectArraysToEqualIgnoringOrder,
  expectPromiseToFailWithError,
  expectToEqual,
  miniStageAgencyKinds,
} from "shared";
import { ConflictError } from "shared";
import { KyselyDb, makeKyselyDb } from "../../../config/pg/kysely/kyselyUtils";
import { getTestPgPool } from "../../../config/pg/pgUtils";
import { PgUserRepository } from "../../core/authentication/inclusion-connect/adapters/PgUserRepository";
import {
  PgAgencyRepository,
  safirConflictErrorMessage,
} from "./PgAgencyRepository";

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
  .withCoveredDepartments(["75"])
  .withCounsellorEmails(["counsellor1@agency1.fr", "counsellor2@agency1.fr"])
  .withValidatorEmails(["validator1@agency1.fr", "validator2@agency1.fr"])
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
  .withQuestionnaireUrl("http://questionnaire.agency2.fr")
  .withSignature("The team of agency2");

const inactiveAgency = AgencyDtoBuilder.create(
  "55555555-5555-5555-5555-555555555555",
)
  .withStatus("needsReview")
  .withPosition(48.7, 6.2)
  .build();

const safirCode = "AAAAAA";
const agency1 = agency1builder
  .withId("aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa")
  .withAgencySiret("01234567890123")
  .withCodeSafir(safirCode)
  .build();

const agency2 = agency2builder.withCodeSafir(safirCode).build();

const agencyWithRefersTo = agency2builder
  .withRefersToAgencyInfo({
    refersToAgencyId: agency1.id,
    refersToAgencyName: agency1.name,
  })
  .build();

describe("PgAgencyRepository", () => {
  let pool: Pool;
  let agencyRepository: PgAgencyRepository;
  let userRepository: PgUserRepository;
  let db: KyselyDb;

  beforeAll(async () => {
    pool = getTestPgPool();
    db = makeKyselyDb(pool);
  });

  afterAll(async () => {
    await pool.end();
  });

  beforeEach(async () => {
    await db.deleteFrom("conventions").execute();
    await db.deleteFrom("agency_groups__agencies").execute();
    await db.deleteFrom("agency_groups").execute();
    await db.deleteFrom("users_ongoing_oauths").execute();
    await db.deleteFrom("users__agencies").execute();
    await db.deleteFrom("agencies").execute();
    await db.deleteFrom("users").execute();

    agencyRepository = new PgAgencyRepository(makeKyselyDb(pool));
    userRepository = new PgUserRepository(makeKyselyDb(pool));
  });

  describe("getById", () => {
    it("returns undefined when no agency found", async () => {
      const retrievedAgency = await agencyRepository.getById(agency1.id);
      expect(retrievedAgency).toBeUndefined();
    });

    it("returns existing agency", async () => {
      await agencyRepository.insert(agency1);

      const retrievedAgency = await agencyRepository.getById(agency1.id);
      expectToEqual(retrievedAgency, agency1);
    });

    it("returns existing agency, with link to a refering one if it exists", async () => {
      await agencyRepository.insert(agency1);
      await agencyRepository.insert(agencyWithRefersTo);

      const retrievedAgency = await agencyRepository.getById(
        agencyWithRefersTo.id,
      );
      expectToEqual(retrievedAgency, agencyWithRefersTo);
    });
  });

  describe("getByIds", () => {
    it("returns existing agency", async () => {
      await agencyRepository.insert(agency1);

      const agencies = await agencyRepository.getByIds([agency1.id]);
      expectToEqual(agencies, [agency1]);
    });

    it("returns all agencies matching ids", async () => {
      const agency2 = agency1builder
        .withKind("cci")
        .withId("bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb")
        .withAgencySiret("00000000000000")
        .withCodeSafir("BBBBBB")
        .build();
      const agency3 = agency1builder
        .withKind("mission-locale")
        .withId("cccccccc-cccc-4ccc-cccc-cccccccccccc")
        .withAgencySiret("11111111111111")
        .withCodeSafir("CCCCCC")
        .build();

      await Promise.all([
        agencyRepository.insert(agency1),
        agencyRepository.insert(agency2),
        agencyRepository.insert(agency3),
      ]);

      const agencies = await agencyRepository.getByIds([
        agency1.id,
        agency3.id,
      ]);
      expectToEqual(agencies, [agency3, agency1]);
    });

    it("throws when no agencies are found", async () => {
      await expectPromiseToFailWithError(
        agencyRepository.getByIds([agency1.id]),
        errors.agencies.notFound({ agencyIds: [agency1.id] }),
      );
    });
  });

  describe("getBySafir", () => {
    it("returns undefined when no agency found", async () => {
      const retrievedAgency = await agencyRepository.getBySafir(agency1.id);
      expect(retrievedAgency).toBeUndefined();
    });

    it("returns existing agency", async () => {
      await agencyRepository.insert(agency1);

      const retrievedAgency = await agencyRepository.getBySafir(safirCode);
      expectToEqual(retrievedAgency, agency1);
    });

    it("throw conflict error on multiple agencies with same safir code", async () => {
      await agencyRepository.insert(agency1);
      await agencyRepository.insert(agency2);

      await expectPromiseToFailWithError(
        agencyRepository.getBySafir(safirCode),
        new ConflictError(
          safirConflictErrorMessage(safirCode, [agency1, agency2]),
        ),
      );
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
      .withPosition(48.8415502, 2.4019552)
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

    const agencyInParisBuilder = new AgencyDtoBuilder().withAddress({
      departmentCode: "75",
      city: "Paris",
      postcode: "75001",
      streetNumberAndAddress: "OSEF",
    });

    const agencyCciInParis = agencyInParisBuilder
      .withId("55555555-5555-5555-5555-555555555555")
      .withKind("cci")
      .build();

    const agencyChambreAgriculture = agencyInParisBuilder
      .withId("77777777-7777-7777-7777-777777777777")
      .withKind("chambre-agriculture")
      .build();

    const agencyCma = agencyInParisBuilder
      .withId("88888888-8888-8888-8888-888888888888")
      .withKind("cma")
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
          position: {
            position: { lat: 48.866667, lon: 2.333333 },
            distance_km: 10,
          },
        },
        limit: 2,
      });
      expect(sortById(agencies)).toEqual([agency2MissionLocale, agency1PE]);
    });

    it("return agencies matching the provided kinds", async () => {
      await Promise.all([
        agencyRepository.insert(agencyCciInParis),
        agencyRepository.insert(agency1PE),
        agencyRepository.insert(agencyChambreAgriculture),
        agencyRepository.insert(agencyCma),
      ]);

      const agenciesMiniStage = await agencyRepository.getAgencies({
        filters: { kinds: miniStageAgencyKinds },
      });
      expect(sortById(agenciesMiniStage)).toEqual([
        agencyCciInParis,
        agencyChambreAgriculture,
        agencyCma,
      ]);

      const agenciesFt = await agencyRepository.getAgencies({
        filters: { kinds: ["pole-emploi"] },
      });
      expect(agenciesFt).toEqual([agency1PE]);
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

    it("returns all agencies filtered by siret", async () => {
      await Promise.all([
        agencyRepository.insert(agency1),
        agencyRepository.insert(agency2),
      ]);
      const agencies = await agencyRepository.getAgencies({
        filters: { siret: "01234567890123" },
      });
      expect(sortById(agencies)).toEqual([agency1]);
    });

    it("returns agencies filtered by departmentCode", async () => {
      const agencyWithParisInCoveredDepartments = new AgencyDtoBuilder()
        .withId("66666666-6666-6666-6666-666666666666")
        .withKind("cci")
        .withAddress({
          departmentCode: "64",
          city: "Bayonne",
          postcode: "64100",
          streetNumberAndAddress: "OSEF",
        })
        .withCoveredDepartments(["64", "75"])
        .build();

      await Promise.all([
        agencyRepository.insert(agenciesByName[0]),
        agencyRepository.insert(agenciesByName[1]),
        agencyRepository.insert(agenciesByName[2]),
        agencyRepository.insert(agencyCciInParis),
        agencyRepository.insert(agencyWithParisInCoveredDepartments),
      ]);
      const agencies = await agencyRepository.getAgencies({
        filters: { departmentCode: "75" },
      });
      expect(sortById(agencies)).toEqual([
        agencyCciInParis,
        agencyWithParisInCoveredDepartments,
      ]);
    });
    it("should not return refered agencies when the filter is provided", async () => {
      await agencyRepository.insert(agency1);
      await agencyRepository.insert(agencyWithRefersTo);

      const agencies = await agencyRepository.getAgencies({
        filters: { doesNotReferToOtherAgency: true },
      });

      expect(sortById(agencies)).toEqual([agency1]);
    });
  });

  describe("getAgenciesRelatedToAgency", () => {
    it("found related agencies", async () => {
      await agencyRepository.insert(agency1);
      await agencyRepository.insert(agencyWithRefersTo);

      expectToEqual(
        await agencyRepository.getAgenciesRelatedToAgency(agency1.id),
        [agencyWithRefersTo],
      );
    });

    it("empty when there is no related agencies", async () => {
      await agencyRepository.insert(agency1);

      expectToEqual(
        await agencyRepository.getAgenciesRelatedToAgency(agency1.id),
        [],
      );
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

      const parisAgency = agency1builder
        .withId("11111111-1111-1111-1111-111211111112")
        .withName("Agency Val d'Oise")
        .withAddress({
          departmentCode: "75",
          city: "Paris",
          postcode: "75000",
          streetNumberAndAddress: "au fond à droite",
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
      expectToEqual(agencies, [cergyAgency]);
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

    it("inserts unknown agencies", async () => {
      expect(await agencyRepository.getAgencies({})).toHaveLength(0);

      await agencyRepository.insert(agency1);
      const allActiveAgencies = await agencyRepository.getAgencies({});
      expect(allActiveAgencies).toHaveLength(1);
      expect(allActiveAgencies[0]).toEqual(agency1);

      await agencyRepository.insert(agency2);
      expect(await agencyRepository.getAgencies({})).toHaveLength(2);
    });

    it("save correct agency right even if user is counsellor and validator", async () => {
      expect(await agencyRepository.getAgencies({})).toHaveLength(0);
      const userEmail = "user@mail.com";
      const agency = agency1builder
        .withCounsellorEmails([userEmail])
        .withValidatorEmails([userEmail])
        .build();
      await agencyRepository.insert(agency);
      expectToEqual(await agencyRepository.getAgencies({}), [agency]);
    });

    it("keeps the acquisitions fields when provided", async () => {
      const withAcquisition = {
        acquisitionKeyword: "keyword",
        acquisitionCampaign: "campaign",
      } satisfies WithAcquisition;
      const agency = agency1builder.withAcquisition(withAcquisition).build();
      await agencyRepository.insert(agency);
      const result = await db
        .selectFrom("agencies")
        .select(["acquisition_campaign", "acquisition_keyword"])
        .execute();

      expectToEqual(result, [
        {
          acquisition_campaign: withAcquisition.acquisitionCampaign,
          acquisition_keyword: withAcquisition.acquisitionKeyword,
        },
      ]);
    });
  });

  describe("update", () => {
    const agency1 = agency1builder
      .withPosition(40, 2)
      .withStatus("active")
      .build();

    it("updates the entire entity", async () => {
      expect(await agencyRepository.getAgencies({})).toHaveLength(0);

      await agencyRepository.insert(agency1);
      expect(await agencyRepository.getAgencies({})).toHaveLength(1);

      const updatedAgency1 = agency1builder
        .withStatus("rejected")
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
        .withRejectionJustification("justification du rejet")
        .build();

      await agencyRepository.update(updatedAgency1);
      const inDb = await agencyRepository.getAgencies({});
      expect(inDb).toHaveLength(1);
      expectToEqual(inDb[0], updatedAgency1);
    });

    it("updates the only some fields", async () => {
      expect(await agencyRepository.getAgencies({})).toHaveLength(0);

      await agencyRepository.insert(agency1);
      expect(await agencyRepository.getAgencies({})).toHaveLength(1);

      await agencyRepository.update({
        id: agency1.id,
        status: "rejected",
        rejectionJustification: "justification du rejet",
      });
      const inDb = await agencyRepository.getAgencies({});
      expect(inDb).toHaveLength(1);
      expectToEqual(inDb[0], {
        ...agency1,
        status: "rejected",
        rejectionJustification: "justification du rejet",
      });
    });

    it("switch the counsellor to validator", async () => {
      expect(await agencyRepository.getAgencies({})).toHaveLength(0);
      const agencyWithTwoStepValidation = agency1builder
        .withCounsellorEmails(["counsellor@email.fr"])
        .withValidatorEmails(["validator@email.fr"])
        .withStatus("active")
        .build();

      await agencyRepository.insert(agencyWithTwoStepValidation);
      expect(await agencyRepository.getAgencies({})).toHaveLength(1);
      const users = await userRepository.getIcUsersWithFilter(
        {
          agencyId: agencyWithTwoStepValidation.id,
        },
        "InclusionConnect",
      );
      const counsellor = users.find(
        (user) => user.email === "counsellor@email.fr",
      );
      const validator = users.find(
        (user) => user.email === "validator@email.fr",
      );
      expect(users).toHaveLength(2);
      expectArraysToEqualIgnoringOrder(users, [
        {
          ...validator,
          agencyRights: [
            {
              agency: agencyWithTwoStepValidation,
              roles: ["validator"],
              isNotifiedByEmail: true,
            },
          ],
        },
        {
          ...counsellor,
          agencyRights: [
            {
              agency: agencyWithTwoStepValidation,
              roles: ["counsellor"],
              isNotifiedByEmail: true,
            },
          ],
        },
      ]);

      await agencyRepository.update({
        id: agencyWithTwoStepValidation.id,
        validatorEmails: ["counsellor@email.fr"], // the counsellor becomes a validator
        counsellorEmails: [],
      });
      const updatedUsers = await userRepository.getIcUsersWithFilter(
        {
          agencyId: agencyWithTwoStepValidation.id,
        },
        "InclusionConnect",
      );
      const expectedUpdatedAgency: AgencyDto = {
        ...agencyWithTwoStepValidation,
        validatorEmails: ["counsellor@email.fr"],
        counsellorEmails: [],
      };
      expectArraysToEqualIgnoringOrder(await agencyRepository.getAgencies({}), [
        expectedUpdatedAgency,
      ]);
      expect(updatedUsers).toHaveLength(1);
      expectArraysToEqualIgnoringOrder(updatedUsers, [
        {
          ...counsellor,
          agencyRights: [
            {
              agency: expectedUpdatedAgency,
              roles: ["validator"],
              isNotifiedByEmail: true,
            },
          ],
        },
      ]);
    });
  });

  describe("alreadyHasActiveAgencyWithSameAddressAndKind", () => {
    it("return false if no agency exists with given address and kind", async () => {
      const hasAlreadySimilarAgency =
        await agencyRepository.alreadyHasActiveAgencyWithSameAddressAndKind({
          address: agency1.address,
          kind: agency1.kind,
          idToIgnore: agency1.id,
        });

      expect(hasAlreadySimilarAgency).toBe(false);
    });

    it("return true if there is an agency with given address and kind", async () => {
      const newAgency = new AgencyDtoBuilder()
        .withAddress(agency1.address)
        .withKind(agency1.kind)
        .withStatus("needsReview")
        .build();

      await agencyRepository.insert(agency1);
      await agencyRepository.insert(newAgency);

      const hasAlreadySimilarAgency =
        await agencyRepository.alreadyHasActiveAgencyWithSameAddressAndKind({
          address: newAgency.address,
          kind: newAgency.kind,
          idToIgnore: newAgency.id,
        });

      expect(hasAlreadySimilarAgency).toBe(true);
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

    const [storedAgency] = await agencyRepository.getByIds([agency1a.id]);
    expect(storedAgency?.name).toEqual(agency1a.name);
  });
});

const sortById = (agencies: AgencyDto[]): AgencyDto[] =>
  [...agencies].sort((a, b) => (a.id < b.id ? -1 : 1));
