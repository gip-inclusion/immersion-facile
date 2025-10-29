import { addDays, subDays } from "date-fns";
import { sql } from "kysely";
import type { Pool } from "pg";
import {
  type AgencyDto,
  AgencyDtoBuilder,
  type AgencyId,
  type AgencyKind,
  type AppellationCode,
  AssessmentDtoBuilder,
  ConnectedUserBuilder,
  type ConventionDto,
  ConventionDtoBuilder,
  type ConventionId,
  type ConventionReadDto,
  type ConventionStatus,
  DATE_START,
  type DateString,
  expectToEqual,
  reasonableSchedule,
  type SiretDto,
  type UserWithAdminRights,
} from "shared";
import { v4 as uuid } from "uuid";
import {
  type KyselyDb,
  makeKyselyDb,
} from "../../../config/pg/kysely/kyselyUtils";
import { makeTestPgPool } from "../../../config/pg/pgPool";
import { toAgencyWithRights } from "../../../utils/agency";
import { assesmentEntityToConventionAssessmentFields } from "../../../utils/convention";
import { PgAgencyRepository } from "../../agency/adapters/PgAgencyRepository";
import { PgUserRepository } from "../../core/authentication/connected-user/adapters/PgUserRepository";
import {
  type AssessmentEntity,
  createAssessmentEntity,
} from "../entities/AssessmentEntity";
import type { GetConventionsParams } from "../ports/ConventionQueries";
import { PgAssessmentRepository } from "./PgAssessmentRepository";
import { PgConventionQueries } from "./PgConventionQueries";
import { PgConventionRepository } from "./PgConventionRepository";

describe("Pg implementation of ConventionQueries", () => {
  const conventionIdA: ConventionId = "aaaaac99-9c0b-1aaa-aa6d-6bb9bd38aaaa";
  const conventionIdB: ConventionId = "bbbbbc99-9c0b-1bbb-bb6d-6bb9bd38bbbb";
  const agencyIdA: AgencyId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
  const agencyIdB: AgencyId = "bbbbbbbb-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
  const anyConventionUpdatedAt = new Date("2022-05-20T12:43:11").toISOString();

  const validator = new ConnectedUserBuilder()
    .withEmail("validator@mail.com")
    .withId("77777777-6666-4777-7777-777777777777")
    .buildUser();

  let pool: Pool;
  let conventionQueries: PgConventionQueries;
  let agencyRepo: PgAgencyRepository;
  let assessmentRepo: PgAssessmentRepository;
  let conventionRepository: PgConventionRepository;
  let db: KyselyDb;

  beforeAll(async () => {
    pool = makeTestPgPool();
    db = makeKyselyDb(pool);
  });

  beforeEach(async () => {
    await db.deleteFrom("conventions").execute();
    await sql`TRUNCATE TABLE convention_external_ids RESTART IDENTITY;`.execute(
      db,
    );
    await db.deleteFrom("agency_groups__agencies").execute();
    await db.deleteFrom("agency_groups").execute();
    await db.deleteFrom("agencies").execute();
    await db.deleteFrom("notifications_email_recipients").execute();
    await db.deleteFrom("notifications_email").execute();
    await db.deleteFrom("immersion_assessments").execute();

    conventionQueries = new PgConventionQueries(db);
    agencyRepo = new PgAgencyRepository(db);
    assessmentRepo = new PgAssessmentRepository(db);
    conventionRepository = new PgConventionRepository(db);

    await new PgUserRepository(db).save(validator);
  });

  afterAll(async () => {
    await pool.end();
  });

  describe("getConventionById", () => {
    it("Returns undefined if no convention with such id", async () => {
      expect(
        await conventionQueries.getConventionById(conventionIdA),
      ).toBeUndefined();
    });

    it("Retrieves a convention by id exists", async () => {
      // Prepare
      const expectedConventionRead = await insertAgencyAndConvention({
        conventionId: conventionIdA,
        agencyId: conventionIdA,
        agencyName: "agency A",
        agencyDepartment: "75",
        agencyKind: "autre",
        agencySiret: "11112222000033",
        conventionUpdatedAt: anyConventionUpdatedAt,
        validatorUser: validator,
      });

      // Act
      const result = await conventionQueries.getConventionById(conventionIdA);

      // Assert
      expectToEqual(result, expectedConventionRead);
    });

    it("Retrieves a convention by id exists with refersToAgency", async () => {
      const referringAgency = new AgencyDtoBuilder()
        .withName("Agence référente")
        .withId(uuid())
        .withAgencySiret("55552222000055")
        .build();

      const expectedConventionRead = await insertAgencyAndConvention({
        conventionId: conventionIdA,
        agencyId: conventionIdA,
        agencyName: "Agency A",
        agencyDepartment: "75",
        agencyKind: "autre",
        agencySiret: "11112222000033",
        withRefersToAgency: referringAgency,
        conventionUpdatedAt: anyConventionUpdatedAt,
        validatorUser: validator,
      });

      const result = await conventionQueries.getConventionById(conventionIdA);
      expectToEqual(result, expectedConventionRead);
    });

    it("Retrieves a convention by id exists with assessment", async () => {
      const expectedConventionRead = await insertAgencyAndConvention({
        conventionId: conventionIdA,
        agencyId: conventionIdA,
        agencyName: "agency A",
        agencyDepartment: "75",
        agencyKind: "autre",
        agencySiret: "11112222000033",
        conventionUpdatedAt: anyConventionUpdatedAt,
        validatorUser: validator,
        conventionStatus: "ACCEPTED_BY_VALIDATOR",
        assessment: {
          _entityName: "Assessment",
          conventionId: conventionIdA,
          status: "COMPLETED",
          endedWithAJob: false,
          establishmentFeedback: "Great experience",
          establishmentAdvices: "Keep up the good work",
          numberOfHoursActuallyMade: 100,
        },
      });

      const result = await conventionQueries.getConventionById(conventionIdA);
      expectToEqual(result, expectedConventionRead);
    });
  });

  describe("getConventionsByScope", () => {
    let franceTravailConvention: ConventionReadDto;
    let cciConvention: ConventionReadDto;

    beforeEach(async () => {
      franceTravailConvention = await insertAgencyAndConvention({
        conventionId: conventionIdA,
        agencyId: agencyIdA,
        agencyName: "agency PE",
        agencyDepartment: "75",
        agencyKind: "pole-emploi",
        agencySiret: "11112222000044",
        conventionStartDate: new Date("2021-01-10").toISOString(),
        conventionStatus: "IN_REVIEW",
        conventionUpdatedAt: anyConventionUpdatedAt,
        validatorUser: validator,
      });
      cciConvention = await insertAgencyAndConvention({
        conventionId: conventionIdB,
        agencyId: agencyIdB,
        agencyName: "agency CCI",
        agencyDepartment: "75",
        agencyKind: "cci",
        agencySiret: "11112222000055",
        conventionStartDate: new Date("2021-01-15").toISOString(),
        conventionStatus: "READY_TO_SIGN",
        conventionUpdatedAt: anyConventionUpdatedAt,
        validatorUser: validator,
      });
      await insertAgencyAndConvention({
        conventionId: "cccccc99-9c0b-1bbb-bb6d-6bb9bd38bbbb",
        agencyId: "cccccccc-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        agencyName: "agency Mission Locale",
        agencyDepartment: "75",
        agencyKind: "mission-locale",
        agencySiret: "11112222000066",
        conventionStartDate: new Date("2021-01-12").toISOString(),
        conventionStatus: "IN_REVIEW",
        conventionUpdatedAt: anyConventionUpdatedAt,
        validatorUser: validator,
      });
    });

    describe("when no scope", () => {
      it("returns empty array if scope is empty", async () => {
        const result = await conventionQueries.getConventionsByScope({
          scope: {
            agencyKinds: [],
          },
          limit: 5,
          filters: {},
        });

        expectToEqual(result, []);
      });
    });

    describe("when only agencyKinds", () => {
      it("return empty array when no convention matching agencyKinds", async () => {
        const result = await conventionQueries.getConventionsByScope({
          scope: {
            agencyKinds: ["conseil-departemental"],
          },
          limit: 5,
          filters: {},
        });

        expectToEqual(result, []);
      });

      it("return conventions matching agencyKinds", async () => {
        const result = await conventionQueries.getConventionsByScope({
          scope: {
            agencyKinds: ["pole-emploi", "cci"],
          },
          limit: 5,
          filters: {},
        });

        expectToEqual(result, [cciConvention, franceTravailConvention]);
      });

      it("return conventions matching agencyKinds and status", async () => {
        const result = await conventionQueries.getConventionsByScope({
          scope: {
            agencyKinds: ["pole-emploi", "cci"],
          },
          limit: 5,
          filters: {
            withStatuses: ["IN_REVIEW"],
          },
        });

        expectToEqual(result, [franceTravailConvention]);
      });
    });

    describe("when only agencyIds", () => {
      it("return empty array when no convention matching agencyIds", async () => {
        const result = await conventionQueries.getConventionsByScope({
          scope: {
            agencyIds: ["ccaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"],
          },
          limit: 5,
          filters: {},
        });

        expectToEqual(result, []);
      });

      it("return conventions matching agencyIds", async () => {
        const result = await conventionQueries.getConventionsByScope({
          scope: {
            agencyIds: [agencyIdA, agencyIdB],
          },
          limit: 5,
          filters: {},
        });

        expectToEqual(result, [cciConvention, franceTravailConvention]);
      });
    });

    it("should limit number of conventions returned", async () => {
      const result = await conventionQueries.getConventionsByScope({
        scope: {
          agencyKinds: ["pole-emploi", "cci"],
        },
        limit: 1,
        filters: {},
      });

      expectToEqual(result, [cciConvention]);
    });
  });

  describe("getConventionsByFilters", () => {
    const agency = AgencyDtoBuilder.create()
      .withId("bbbbbc15-9c0a-1aaa-aa6d-6aa9ad38aaff")
      .build();

    const conventionCancelledAndDateStart20230327 = new ConventionDtoBuilder()
      .withSiret("11111111111111")
      .withId("bbbbbc15-9c0a-1aaa-aa6d-6aa9ad38aa01")
      .withDateStart(new Date("2023-03-27").toISOString())
      .withDateEnd(new Date("2023-03-28").toISOString())
      .withSchedule(reasonableSchedule)
      .withStatus("CANCELLED")
      .withAgencyId(agency.id)
      .withUpdatedAt(new Date("2023-03-28").toISOString())
      .build();

    const conventionReadyToSignAndDateStart20230330 = new ConventionDtoBuilder()
      .withSiret("11111111111112")
      .withId("bbbbbc15-9c0a-1aaa-aa6d-6aa9ad38aa02")
      .withDateSubmission(new Date("2023-03-05").toISOString())
      .withDateStart(new Date("2023-03-30").toISOString())
      .withDateEnd(new Date("2023-03-31").toISOString())
      .withSchedule(reasonableSchedule)
      .withStatus("READY_TO_SIGN")
      .withAgencyId(agency.id)
      .withUpdatedAt(new Date("2023-03-31").toISOString())
      .build();

    const firstValidatedConvention = new ConventionDtoBuilder()
      .withSiret("11111111111113")
      .withId("bbbbbc15-9c0a-1aaa-aa6d-6aa9ad38aa03")
      .withDateSubmission(new Date("2024-06-20").toISOString())
      .withDateStart(new Date("2024-07-01").toISOString())
      .withDateEnd(new Date("2024-07-02").toISOString())
      .withSchedule(reasonableSchedule)
      .withStatus("ACCEPTED_BY_VALIDATOR")
      .validated()
      .withDateValidation(new Date("2024-06-25").toISOString())
      .withAgencyId(agency.id)
      .withUpdatedAt(new Date("2025-01-01").toISOString())
      .build();

    const secondValidatedConvention = new ConventionDtoBuilder()
      .withSiret("11111111111114")
      .withId("bbbbbc15-9c0a-1aaa-aa6d-6aa9ad38aa04")
      .withDateSubmission(new Date("2024-06-21").toISOString())
      .withDateStart(new Date("2024-07-02").toISOString())
      .withDateEnd(new Date("2024-07-03").toISOString())
      .withSchedule(reasonableSchedule)
      .withStatus("ACCEPTED_BY_VALIDATOR")
      .validated()
      .withDateValidation(new Date("2024-06-29").toISOString())
      .withAgencyId(agency.id)
      .withUpdatedAt(new Date("2024-07-03").toISOString())
      .build();

    beforeEach(async () => {
      await agencyRepo.insert(
        toAgencyWithRights(agency, {
          [validator.id]: { isNotifiedByEmail: true, roles: ["validator"] },
        }),
      );

      await Promise.all(
        [
          conventionCancelledAndDateStart20230327,
          conventionReadyToSignAndDateStart20230330,
          firstValidatedConvention,
          secondValidatedConvention,
        ].map((convention) =>
          conventionRepository.save(convention, convention.updatedAt),
        ),
      );
    });

    it.each([
      {
        testName: "with filter ids",
        params: {
          filters: {
            ids: [conventionCancelledAndDateStart20230327.id],
          },
          sortBy: "dateStart",
        },
        expectedConventions: [conventionCancelledAndDateStart20230327],
      },
      {
        testName: "with filter dateSubmissionEqual",
        params: {
          filters: {
            dateSubmissionEqual: new Date(
              conventionCancelledAndDateStart20230327.dateSubmission,
            ),
          },
          sortBy: "dateStart",
        },
        expectedConventions: [conventionCancelledAndDateStart20230327],
      },
      {
        testName: "with filter withStatuses [READY_TO_SIGN]",
        params: {
          filters: {
            withStatuses: ["READY_TO_SIGN"],
          },
          sortBy: "dateStart",
        },
        expectedConventions: [conventionReadyToSignAndDateStart20230330],
      },
      {
        testName: "with filter startDateGreater 2023-03-26",
        params: {
          filters: {
            startDateGreater: addDays(
              new Date(conventionCancelledAndDateStart20230327.dateStart),
              -1,
            ),
          },
          sortBy: "dateStart",
        },
        expectedConventions: [
          secondValidatedConvention,
          firstValidatedConvention,
          conventionReadyToSignAndDateStart20230330,
          conventionCancelledAndDateStart20230327,
        ],
      },
      {
        testName: "with filter startDateLessOrEqual 2023-03-27",
        params: {
          filters: {
            startDateLessOrEqual: new Date(
              conventionCancelledAndDateStart20230327.dateStart,
            ),
          },
          sortBy: "dateStart",
        },
        expectedConventions: [conventionCancelledAndDateStart20230327],
      },
      {
        testName: "with filter withSirets",
        params: {
          filters: {
            withSirets: [
              firstValidatedConvention.siret,
              secondValidatedConvention.siret,
            ],
          },
          sortBy: "dateStart",
        },
        expectedConventions: [
          secondValidatedConvention,
          firstValidatedConvention,
        ],
      },
      {
        testName: "with filter endDate",
        params: {
          filters: {
            endDate: {
              from: new Date(firstValidatedConvention.dateEnd),
              to: new Date(firstValidatedConvention.dateEnd),
            },
          },
          sortBy: "dateStart",
        },
        expectedConventions: [firstValidatedConvention],
      },
      {
        testName: "with filter updateDate from + to",
        params: {
          filters: {
            updateDate: {
              // biome-ignore lint/style/noNonNullAssertion: applied on convention
              from: new Date(firstValidatedConvention.updatedAt!),
              // biome-ignore lint/style/noNonNullAssertion: applied on convention
              to: new Date(firstValidatedConvention.updatedAt!),
            },
          },
          sortBy: "dateStart",
        },
        expectedConventions: [firstValidatedConvention],
      },
      {
        testName: "with filter updateDate to only",
        params: {
          filters: {
            updateDate: {
              // biome-ignore lint/style/noNonNullAssertion: applied on convention
              to: subDays(new Date(firstValidatedConvention.updatedAt!), 1),
            },
          },
          sortBy: "dateStart",
        },
        expectedConventions: [
          secondValidatedConvention,
          conventionReadyToSignAndDateStart20230330,
          conventionCancelledAndDateStart20230327,
        ],
      },
      {
        testName: `with filters:
          - startDateGreater 2023-03-26
          - startDateLessOrEqual 2023-03-27
          - withStatuses ["READY_TO_SIGN"]`,
        params: {
          filters: {
            startDateGreater: addDays(
              new Date(conventionCancelledAndDateStart20230327.dateStart),
              -1,
            ),
            startDateLessOrEqual: new Date(
              conventionCancelledAndDateStart20230327.dateStart,
            ),
            withStatuses: [conventionCancelledAndDateStart20230327.status],
          },
          sortBy: "dateStart",
        },
        expectedConventions: [conventionCancelledAndDateStart20230327],
      },
      {
        testName: `with filters:
          - startDateGreater 2023-03-30'
          - startDateLessOrEqual 2023-03-31`,
        params: {
          filters: {
            startDateGreater: new Date("2023-03-30"),
            startDateLessOrEqual: new Date("2023-03-31"),
          },
          sortBy: "dateStart",
        },
        expectedConventions: [],
      },
      {
        testName: `with filters :
          - withStatuses ["ACCEPTED-BY-VALIDATOR"]
          - sort by "date_validation"`,
        params: {
          filters: {
            withStatuses: [firstValidatedConvention.status],
          },
          sortBy: "dateValidation",
        },
        expectedConventions: [
          secondValidatedConvention,
          firstValidatedConvention,
        ],
      },
    ] satisfies {
      testName: string;
      params: GetConventionsParams;
      expectedConventions: ConventionDto[];
    }[])("$testName", async ({ params, expectedConventions }) => {
      expectToEqual(
        await conventionQueries.getConventions(params),
        expectedConventions,
      );
    });
  });

  describe("findSimilarConventions", () => {
    const matchingSiret: SiretDto = "11112222333344";
    const matchingAppellation: AppellationCode = "140927";
    const matchingBirthDate = new Date("1992-01-01").toISOString();
    const matchingBeneficiaryLastname = "M'GOMA";
    const matchingDateStart = new Date("2021-01-09").toISOString();
    const someMatchingStatus = "READY_TO_SIGN";
    const conventionMatchingIdA: ConventionId =
      "aaaa1111-1111-4111-9111-11111111aaaa";
    const conventionMatchingIdB: ConventionId =
      "bbbb1111-1111-4111-9111-11111111bbbb";

    beforeEach(async () => {
      await db.deleteFrom("agencies").execute();
      await db.deleteFrom("conventions").execute();

      const agency = AgencyDtoBuilder.create().build();
      const conventionBuilderInitialMatching = new ConventionDtoBuilder()
        .withAgencyId(agency.id)
        .withSiret(matchingSiret)
        .withImmersionAppellation({
          appellationCode: matchingAppellation,
          romeCode: "11111",
          appellationLabel: "osef",
          romeLabel: "osef",
        })
        .withBeneficiaryBirthdate(matchingBirthDate)
        .withBeneficiaryLastName(matchingBeneficiaryLastname)
        .withDateStart(matchingDateStart)
        .withDateEnd(new Date("2021-01-25").toISOString())
        .withStatus(someMatchingStatus);

      const conventionMatchingA = conventionBuilderInitialMatching
        .withId(conventionMatchingIdA)
        .build();

      const conventionMatchingB = conventionBuilderInitialMatching
        .withId(conventionMatchingIdB)
        .withDateStart(new Date("2021-01-10").toISOString())
        .build();

      const conventionWithWrongSiret = conventionBuilderInitialMatching
        .withId("22222222-2222-4222-9222-222222222222")
        .withSiret("40400000000404")
        .build();

      const conventionWithWrongAppellation = conventionBuilderInitialMatching
        .withId("33333333-3333-4333-3333-333333333333")
        .withImmersionAppellation({
          appellationCode: "17010",
          romeCode: "11111",
          appellationLabel: "osef",
          romeLabel: "osef",
        })
        .build();

      const conventionWithWrongBeneficiaryBirthdate =
        conventionBuilderInitialMatching
          .withId("44444444-4444-4444-4444-444444444444")
          .withBeneficiaryBirthdate(new Date("1993-03-03").toISOString())
          .build();

      const conventionWithWrongBeneficiaryLastname =
        conventionBuilderInitialMatching
          .withId("55555555-5555-4555-5555-555555555555")
          .withBeneficiaryLastName("Test")
          .build();

      const conventionWithDateStartToLate = conventionBuilderInitialMatching
        .withId("66666666-6666-4666-6666-666666666666")
        .withDateStart(new Date("2021-01-18").toISOString())
        .build();

      const conventionWithDateStartToEarly = conventionBuilderInitialMatching
        .withId("66660000-0000-4666-6666-000066660000")
        .withDateStart(new Date("2021-01-01").toISOString())
        .build();

      const conventionDeprecated = conventionBuilderInitialMatching
        .withId("77777777-7777-4777-7777-777777777777")
        .withStatus("DEPRECATED")
        .build();
      const conventionRejected = conventionBuilderInitialMatching
        .withId("88888888-8888-4888-8888-888888888888")
        .withStatus("REJECTED")
        .build();
      const conventionCancelled = conventionBuilderInitialMatching
        .withId("99999999-9999-4999-9999-999999999999")
        .withStatus("CANCELLED")
        .build();

      await agencyRepo.insert(
        toAgencyWithRights(agency, {
          [validator.id]: { isNotifiedByEmail: true, roles: ["validator"] },
        }),
      );

      await Promise.all([
        conventionRepository.save(conventionWithWrongSiret),
        conventionRepository.save(conventionWithWrongAppellation),
        conventionRepository.save(conventionWithWrongBeneficiaryBirthdate),
        conventionRepository.save(conventionWithWrongBeneficiaryLastname),
        conventionRepository.save(conventionWithDateStartToEarly),
        conventionRepository.save(conventionWithDateStartToLate),
        conventionRepository.save(conventionDeprecated),
        conventionRepository.save(conventionRejected),
        conventionRepository.save(conventionCancelled),
        conventionRepository.save(conventionMatchingA),
        conventionRepository.save(conventionMatchingB),
      ]);
    });

    it("finds no similar conventions when there is no convention matching", async () => {
      const similarConventionIdsFound =
        await conventionQueries.findSimilarConventions({
          dateStart: new Date("2021-01-01").toISOString(),
          siret: "12345678901234",
          beneficiaryBirthdate: new Date("1990-01-01").toISOString(),
          beneficiaryLastName: "Dupont",
          codeAppellation: "1234567",
        });

      expectToEqual(similarConventionIdsFound, []);
    });

    it("finds similar conventions", async () => {
      const similarConventionIdsFound =
        await conventionQueries.findSimilarConventions({
          dateStart: matchingDateStart,
          siret: matchingSiret,
          beneficiaryBirthdate: matchingBirthDate,
          beneficiaryLastName: matchingBeneficiaryLastname,
          codeAppellation: matchingAppellation,
        });

      expectToEqual(similarConventionIdsFound, [
        conventionMatchingIdB,
        conventionMatchingIdA,
      ]);
    });
  });

  const insertAgencyAndConvention = async ({
    conventionId,
    agencyId,
    agencyName,
    agencyDepartment,
    agencyKind,
    agencySiret,
    withRefersToAgency,
    conventionStartDate = DATE_START,
    conventionStatus = "READY_TO_SIGN",
    conventionUpdatedAt,
    validatorUser,
    assessment,
  }: {
    conventionId: ConventionId;
    agencyId: string;
    agencyName: string;
    agencyDepartment: string;
    agencyKind: AgencyKind;
    agencySiret: SiretDto;
    withRefersToAgency?: AgencyDto;
    conventionStartDate?: string;
    conventionStatus?: ConventionStatus;
    conventionUpdatedAt: DateString;
    validatorUser: UserWithAdminRights;
    assessment?: AssessmentEntity;
  }): Promise<ConventionReadDto> => {
    const convention = new ConventionDtoBuilder()
      .withAgencyId(agencyId)
      .withId(conventionId)
      .withStatus(conventionStatus)
      .withStatusJustification("JUSTIF...")
      .notSigned()
      .withBeneficiary({
        firstName: "benef",
        lastName: "beneficiary",
        email: "benef@r.com",
        phone: "+33112233445",
        role: "beneficiary",
        birthdate: "1990-02-21T00:00:00.000Z",
        emergencyContact: "Billy",
        emergencyContactPhone: "+33112233445",
        emergencyContactEmail: "billy@emergencycontact.com",
        signedAt: new Date().toISOString(),
        isRqth: false,
      })
      .withBeneficiaryCurrentEmployer({
        firstName: "a",
        lastName: "a",
        businessName: "business",
        businessSiret: "01234567890123",
        email: "a@a.com",
        job: "job",
        phone: "+33112233445",
        role: "beneficiary-current-employer",
        signedAt: new Date().toISOString(),
        businessAddress: "Rue des Bouchers 67065 Strasbourg",
      })
      .withBeneficiaryRepresentative({
        email: "rep@rep.com",
        firstName: "beneficiary",
        lastName: "Rep",
        phone: "+33112233445",
        role: "beneficiary-representative",
        signedAt: new Date().toISOString(),
      })
      .withEstablishmentRepresentative({
        email: "est@rep.com",
        firstName: "Establishment",
        lastName: "Rep",
        phone: "+33112233445",
        role: "establishment-representative",
        signedAt: new Date().toISOString(),
      })
      .withDateStart(conventionStartDate)
      .withDateEnd(addDays(new Date(conventionStartDate), 5).toISOString())
      .build();

    const agency = AgencyDtoBuilder.create()
      .withId(agencyId)
      .withName(agencyName)
      .withAddress({
        city: "Paris",
        departmentCode: agencyDepartment,
        postcode: "75017",
        streetNumberAndAddress: "Avenue des champs Elysées",
      })
      .withAgencySiret(agencySiret)
      .withKind(agencyKind)
      .withRefersToAgencyInfo(
        withRefersToAgency
          ? {
              refersToAgencyId: withRefersToAgency.id,
              refersToAgencyName: withRefersToAgency.name,
            }
          : null,
      )
      .build();

    if (withRefersToAgency)
      await agencyRepo.insert(
        toAgencyWithRights(withRefersToAgency, {
          [validatorUser.id]: { isNotifiedByEmail: true, roles: ["validator"] },
        }),
      );

    await agencyRepo.insert(
      toAgencyWithRights(agency, {
        [validatorUser.id]: { isNotifiedByEmail: true, roles: ["validator"] },
      }),
    );

    await conventionRepository.save(convention, conventionUpdatedAt);

    if (assessment) await assessmentRepo.save(assessment);

    return {
      ...convention,
      agencyName,
      agencyDepartment,
      agencyKind,
      agencySiret,
      agencyRefersTo: withRefersToAgency && {
        id: withRefersToAgency.id,
        name: withRefersToAgency.name,
        kind: withRefersToAgency.kind,
      },
      agencyValidatorEmails: [validatorUser.email],
      agencyCounsellorEmails: [],
      updatedAt: conventionUpdatedAt,
      ...assesmentEntityToConventionAssessmentFields(assessment),
    } satisfies ConventionReadDto;
  };

  describe("getConventionsMarketingData", () => {
    const siret1: SiretDto = "11111111111111";
    const siret2: SiretDto = "22222222222222";
    const siret3: SiretDto = "33333333333333";

    const firstValidatedConvention = new ConventionDtoBuilder()
      .withId("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
      .withSiret(siret1)
      .withAgencyId(agencyIdA)
      .withStatus("ACCEPTED_BY_VALIDATOR")
      .validated()
      .withDateValidation(new Date("2024-01-15").toISOString())
      .withDateStart("2024-01-10T08:00:00.000Z")
      .withDateEnd("2024-01-20T08:00:00.000Z")
      .withEstablishmentRepresentative({
        email: "est.rep.a@example.com",
        firstName: "John",
        lastName: "Doe",
        phone: "+33123456789",
        role: "establishment-representative",
        signedAt: new Date().toISOString(),
      })
      .withEstablishmentNumberOfEmployeesRange("1-2")
      .build();

    const secondValidatedConvention = new ConventionDtoBuilder()
      .withId("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")
      .withSiret(siret1)
      .withAgencyId(agencyIdA)
      .withStatus("ACCEPTED_BY_VALIDATOR")
      .validated()
      .withDateValidation(new Date("2024-02-15").toISOString())
      .withDateStart("2024-02-10T08:00:00.000Z")
      .withDateEnd("2024-02-20T08:00:00.000Z")
      .withEstablishmentRepresentative({
        email: "est.rep.b@example.com",
        firstName: "Jane",
        lastName: "Smith",
        phone: "+33123456790",
        role: "establishment-representative",
        signedAt: new Date().toISOString(),
      })
      .withEstablishmentNumberOfEmployeesRange("3-5")
      .build();

    const lastValidatedConvention = new ConventionDtoBuilder()
      .withId("cccccccc-cccc-cccc-cccc-cccccccccccc")
      .withSiret(siret2)
      .withAgencyId(agencyIdA)
      .withStatus("ACCEPTED_BY_VALIDATOR")
      .validated()
      .withDateValidation(new Date("2024-03-15").toISOString())
      .withDateStart("2024-03-10T08:00:00.000Z")
      .withDateEnd("2024-03-20T08:00:00.000Z")
      .withEstablishmentRepresentative({
        email: "est.rep.c@example.com",
        firstName: "Alice",
        lastName: "Johnson",
        phone: "+33123456791",
        role: "establishment-representative",
        signedAt: new Date().toISOString(),
      })
      .withEstablishmentNumberOfEmployeesRange("6-9")
      .build();

    const conventionNotValidated = new ConventionDtoBuilder()
      .withId("dddddddd-dddd-dddd-dddd-dddddddddddd")
      .withSiret(siret1)
      .withAgencyId(agencyIdA)
      .withStatus("READY_TO_SIGN")
      .withoutDateValidation()
      .withDateStart("2024-04-10T08:00:00.000Z")
      .withDateEnd("2024-04-20T08:00:00.000Z")
      .withEstablishmentRepresentative({
        email: "est.rep.d@example.com",
        firstName: "Bob",
        lastName: "Brown",
        phone: "+33123456792",
        role: "establishment-representative",
        signedAt: new Date().toISOString(),
      })
      .build();

    beforeEach(async () => {
      await agencyRepo.insert(
        toAgencyWithRights(new AgencyDtoBuilder().withId(agencyIdA).build(), {
          [validator.id]: { isNotifiedByEmail: true, roles: ["validator"] },
        }),
      );

      await Promise.all([
        conventionRepository.save(
          firstValidatedConvention,
          anyConventionUpdatedAt,
        ),
        conventionRepository.save(
          secondValidatedConvention,
          anyConventionUpdatedAt,
        ),
        conventionRepository.save(
          lastValidatedConvention,
          anyConventionUpdatedAt,
        ),
        conventionRepository.save(
          conventionNotValidated,
          anyConventionUpdatedAt,
        ),
      ]);
    });

    it("should return only validated conventions for specified siret", async () => {
      const result = await conventionQueries.getConventionsMarketingData({
        siret: siret1,
      });

      expectToEqual(result, [
        {
          siret: siret1,
          dateValidation: "2024-01-15T00:00:00.000Z",
          dateEnd: "2024-01-20T08:00:00.000Z",
          establishmentRepresentative: {
            email: "est.rep.a@example.com",
            firstName: "John",
            lastName: "Doe",
          },
          establishmentNumberEmployeesRange: "1-2",
        },
        {
          siret: siret1,
          dateValidation: "2024-02-15T00:00:00.000Z",
          dateEnd: "2024-02-20T08:00:00.000Z",
          establishmentRepresentative: {
            email: "est.rep.b@example.com",
            firstName: "Jane",
            lastName: "Smith",
          },
          establishmentNumberEmployeesRange: "3-5",
        },
      ]);
    });

    it("should return empty array when no validated conventions exist for siret", async () => {
      const result = await conventionQueries.getConventionsMarketingData({
        siret: siret3,
      });

      expectToEqual(result, []);
    });

    it("should sort by dateValidation in ascending order", async () => {
      const result = await conventionQueries.getConventionsMarketingData({
        siret: siret1,
      });

      expect(result).toHaveLength(2);
      expect(result[0].dateValidation).toBe("2024-01-15T00:00:00.000Z");
      expect(result[1].dateValidation).toBe("2024-02-15T00:00:00.000Z");
    });

    it("should handle conventions without establishmentNumberEmployeesRange", async () => {
      const conventionWithoutRange = new ConventionDtoBuilder()
        .withId("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee")
        .withSiret(siret3)
        .withAgencyId(agencyIdA)
        .withStatus("ACCEPTED_BY_VALIDATOR")
        .validated()
        .withDateValidation(new Date("2024-05-15").toISOString())
        .withDateStart("2024-05-10T08:00:00.000Z")
        .withDateEnd("2024-05-20T08:00:00.000Z")
        .withEstablishmentRepresentative({
          email: "est.rep.e@example.com",
          firstName: "Charlie",
          lastName: "Wilson",
          phone: "+33123456793",
          role: "establishment-representative",
          signedAt: new Date().toISOString(),
        })
        .build();

      await conventionRepository.save(
        conventionWithoutRange,
        anyConventionUpdatedAt,
      );

      const result = await conventionQueries.getConventionsMarketingData({
        siret: siret3,
      });

      expectToEqual(result, [
        {
          siret: siret3,
          dateValidation: "2024-05-15T00:00:00.000Z",
          dateEnd: "2024-05-20T08:00:00.000Z",
          establishmentRepresentative: {
            email: "est.rep.e@example.com",
            firstName: "Charlie",
            lastName: "Wilson",
          },
          establishmentNumberEmployeesRange: undefined,
        },
      ]);
    });

    it("should return empty array when siret doesn't exist", async () => {
      const result = await conventionQueries.getConventionsMarketingData({
        siret: "99999999999999" as SiretDto,
      });

      expectToEqual(result, []);
    });
  });

  describe("getPaginatedConventionsForAgencyUser", () => {
    const agencyId = "cccccc99-9c0b-1bbb-bb6d-6bb9bd38cccc";
    const agency = new AgencyDtoBuilder()
      .withId(agencyId)
      .withName("Test Agency")
      .withAddress({
        city: "Paris",
        departmentCode: "75",
        postcode: "75017",
        streetNumberAndAddress: "Avenue des champs Elysées",
      })
      .build();

    const differentAgencyId = "dddddddd-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    const differentAgency = new AgencyDtoBuilder()
      .withId(differentAgencyId)
      .withName("Different Agency")
      .withAddress({
        city: "Lyon",
        departmentCode: "69",
        postcode: "69001",
        streetNumberAndAddress: "Rue de la République",
      })
      .build();

    const singleAgencyUser = new ConnectedUserBuilder()
      .withEmail("single-agency-user@mail.com")
      .withId("11111111-2222-3333-4444-555555555555")
      .buildUser();

    const conventionA = new ConventionDtoBuilder()
      .withId("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa")
      .withSiret("12345678901235")
      .withAgencyId(agencyId)
      .withBeneficiaryEmail("beneficiary@convention-a.com")
      .withStatus("READY_TO_SIGN")
      .withDateStart(new Date("2023-01-15").toISOString())
      .withDateEnd(new Date("2023-01-20").toISOString())
      .withDateSubmission(new Date("2023-01-10").toISOString())
      .withBeneficiaryFirstName("John")
      .withBeneficiaryLastName("Doe")
      .withBusinessName("Business A")
      .withUpdatedAt(anyConventionUpdatedAt)
      .build();

    const conventionB = new ConventionDtoBuilder()
      .withId("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb")
      .withAgencyId(agencyId)
      .withStatus("IN_REVIEW")
      .withDateStart(new Date("2023-02-15").toISOString())
      .withDateEnd(new Date("2023-02-20").toISOString())
      .withDateSubmission(new Date("2023-02-10").toISOString())
      .withBeneficiaryFirstName("Jane")
      .withBeneficiaryLastName("Smith")
      .withBusinessName("Business B")
      .withUpdatedAt(anyConventionUpdatedAt)
      .build();

    const conventionC = new ConventionDtoBuilder()
      .withId("cccccccc-cccc-4ccc-8ccc-cccccccccccc")
      .withAgencyId(agencyId)
      .withStatus("ACCEPTED_BY_VALIDATOR")
      .withDateStart(new Date("2023-03-15").toISOString())
      .withDateEnd(new Date("2023-03-20").toISOString())
      .withDateSubmission(new Date("2023-03-10").toISOString())
      .withBeneficiaryFirstName("Alice")
      .withBeneficiaryLastName("Johnson")
      .withBusinessName("Business C")
      .withUpdatedAt(anyConventionUpdatedAt)
      .build();

    const conventionD = new ConventionDtoBuilder()
      .withId("dddddddd-dddd-4ddd-8ddd-dddddddddddd")
      .withAgencyId(differentAgencyId)
      .withStatus("READY_TO_SIGN")
      .withDateStart(new Date("2023-04-15").toISOString())
      .withDateEnd(new Date("2023-04-20").toISOString())
      .withDateSubmission(new Date("2023-04-10").toISOString())
      .withBeneficiaryFirstName("Bob")
      .withBeneficiaryLastName("Brown")
      .withBusinessName("Business D")
      .withUpdatedAt(anyConventionUpdatedAt)
      .build();

    const assessment = new AssessmentDtoBuilder()
      .withConventionId(conventionC.id)
      .build();

    const agencyFields = {
      agencyName: agency.name,
      agencyDepartment: agency.address.departmentCode,
      agencyKind: agency.kind,
      agencySiret: agency.agencySiret,
      agencyCounsellorEmails: [],
      agencyValidatorEmails: [singleAgencyUser.email, validator.email],
      agencyRefersTo: undefined,
    };

    const differentAgencyFields = {
      agencyName: differentAgency.name,
      agencyDepartment: differentAgency.address.departmentCode,
      agencyKind: differentAgency.kind,
      agencySiret: differentAgency.agencySiret,
      agencyCounsellorEmails: [],
      agencyValidatorEmails: [validator.email],
      agencyRefersTo: undefined,
    };

    beforeEach(async () => {
      await new PgUserRepository(db).save(singleAgencyUser);

      await agencyRepo.insert(
        toAgencyWithRights(agency, {
          [validator.id]: { isNotifiedByEmail: true, roles: ["validator"] },
          [singleAgencyUser.id]: {
            isNotifiedByEmail: true,
            roles: ["validator"],
          },
        }),
      );

      await agencyRepo.insert(
        toAgencyWithRights(differentAgency, {
          [validator.id]: { isNotifiedByEmail: true, roles: ["validator"] },
        }),
      );

      await Promise.all([
        conventionRepository.save(conventionA, anyConventionUpdatedAt),
        conventionRepository.save(conventionB, anyConventionUpdatedAt),
        conventionRepository.save(conventionC, anyConventionUpdatedAt),
        conventionRepository.save(conventionD, anyConventionUpdatedAt),
      ]);

      await assessmentRepo.save(
        createAssessmentEntity(assessment, conventionC),
      );
    });

    it("should return conventions for the agency user with pagination", async () => {
      const resultPage1 =
        await conventionQueries.getPaginatedConventionsForAgencyUser({
          agencyUserId: validator.id,
          pagination: { page: 1, perPage: 2 },
          sort: {
            by: "dateSubmission",
            direction: "desc",
          },
        });

      expect(resultPage1.data.length).toBe(2);
      expect(resultPage1.pagination).toEqual({
        currentPage: 1,
        totalPages: 2,
        numberPerPage: 2,
        totalRecords: 4,
      });
      expectToEqual(resultPage1.data, [
        { ...conventionD, ...differentAgencyFields, assessment: null },
        {
          ...conventionC,
          ...agencyFields,
          assessment: { status: "COMPLETED", endedWithAJob: false },
        },
      ]);

      const resultPage2 =
        await conventionQueries.getPaginatedConventionsForAgencyUser({
          agencyUserId: validator.id,
          pagination: { page: 2, perPage: 2 },
          sort: {
            by: "dateSubmission",
            direction: "desc",
          },
        });

      expect(resultPage2.data.length).toBe(2);
      expectToEqual(resultPage2.data, [
        { ...conventionB, ...agencyFields, assessment: null },
        { ...conventionA, ...agencyFields, assessment: null },
      ]);
      expectToEqual(resultPage2.pagination, {
        currentPage: 2,
        totalPages: 2,
        numberPerPage: 2,
        totalRecords: 4,
      });
    });

    it("should filter conventions by status", async () => {
      const result =
        await conventionQueries.getPaginatedConventionsForAgencyUser({
          agencyUserId: validator.id,
          pagination: { page: 1, perPage: 10 },
          filters: { statuses: ["READY_TO_SIGN"] },
          sort: {
            by: "dateSubmission",
            direction: "desc",
          },
        });

      expect(result.data.length).toBe(2);
      expectToEqual(result.data, [
        { ...conventionD, ...differentAgencyFields, assessment: null },
        { ...conventionA, ...agencyFields, assessment: null },
      ]);
    });

    it("should filter conventions by beneficiary name", async () => {
      const result =
        await conventionQueries.getPaginatedConventionsForAgencyUser({
          agencyUserId: validator.id,
          pagination: { page: 1, perPage: 10 },
          filters: { search: "John" },
          sort: {
            by: "dateSubmission",
            direction: "desc",
          },
        });

      expect(result.data.length).toBe(2);
    });

    it("should filter conventions by establishment name", async () => {
      const result =
        await conventionQueries.getPaginatedConventionsForAgencyUser({
          agencyUserId: validator.id,
          pagination: { page: 1, perPage: 10 },
          filters: { search: "Business B" },
          sort: {
            by: "dateSubmission",
            direction: "desc",
          },
        });

      expect(result.data.length).toBe(1);
      expectToEqual(result.data, [
        { ...conventionB, ...agencyFields, assessment: null },
      ]);
    });

    it("should filter conventions by establishment SIRET", async () => {
      const result =
        await conventionQueries.getPaginatedConventionsForAgencyUser({
          agencyUserId: validator.id,
          pagination: { page: 1, perPage: 10 },
          filters: { search: conventionA.siret },
          sort: {
            by: "dateSubmission",
            direction: "desc",
          },
        });
      expectToEqual(result.data, [
        { ...conventionA, ...agencyFields, assessment: null },
      ]);
    });

    it("should filter conventions by convention ID", async () => {
      const result =
        await conventionQueries.getPaginatedConventionsForAgencyUser({
          agencyUserId: validator.id,
          pagination: { page: 1, perPage: 10 },
          filters: { search: conventionA.id },
          sort: {
            by: "dateSubmission",
            direction: "desc",
          },
        });

      expect(result.data.length).toBe(1);
      expectToEqual(result.data, [
        { ...conventionA, ...agencyFields, assessment: null },
      ]);
    });

    it("should return no results for non-existent convention ID", async () => {
      const result =
        await conventionQueries.getPaginatedConventionsForAgencyUser({
          agencyUserId: validator.id,
          pagination: { page: 1, perPage: 10 },
          filters: { search: "00000000-0000-0000-0000-000000000000" },
          sort: {
            by: "dateSubmission",
            direction: "desc",
          },
        });

      expect(result.data.length).toBe(0);
      expectToEqual(result.data, []);
    });

    it("should filter conventions by date range", async () => {
      const result =
        await conventionQueries.getPaginatedConventionsForAgencyUser({
          agencyUserId: validator.id,
          pagination: { page: 1, perPage: 10 },
          filters: {
            dateStart: {
              from: "2023-02-01",
              to: "2023-03-31",
            },
          },
          sort: {
            by: "dateSubmission",
            direction: "desc",
          },
        });

      expect(result.data.length).toBe(2);
      expectToEqual(result.data, [
        {
          ...conventionC,
          ...agencyFields,
          assessment: { status: "COMPLETED", endedWithAJob: false },
        },
        { ...conventionB, ...agencyFields, assessment: null },
      ]);
    });

    it("should filter conventions by assessment completion status - completed", async () => {
      const result =
        await conventionQueries.getPaginatedConventionsForAgencyUser({
          agencyUserId: validator.id,
          pagination: { page: 1, perPage: 10 },
          filters: { assessmentCompletionStatus: "completed" },
          sort: {
            by: "dateSubmission",
            direction: "desc",
          },
        });

      expectToEqual(result.data, [
        {
          ...conventionC,
          ...agencyFields,
          assessment: { status: "COMPLETED", endedWithAJob: false },
        },
      ]);
    });

    it("should sort conventions by dateStart", async () => {
      const result =
        await conventionQueries.getPaginatedConventionsForAgencyUser({
          agencyUserId: validator.id,
          pagination: { page: 1, perPage: 10 },
          sort: {
            by: "dateStart",
            direction: "asc",
          },
        });

      expect(result.data.length).toBe(4);
      expectToEqual(result.data, [
        { ...conventionA, ...agencyFields, assessment: null },
        { ...conventionB, ...agencyFields, assessment: null },
        {
          ...conventionC,
          ...agencyFields,
          assessment: { status: "COMPLETED", endedWithAJob: false },
        },
        { ...conventionD, ...differentAgencyFields, assessment: null },
      ]);
    });

    it("should respect pagination limits", async () => {
      const result =
        await conventionQueries.getPaginatedConventionsForAgencyUser({
          agencyUserId: validator.id,
          pagination: { page: 1, perPage: 2 },
          sort: {
            by: "dateSubmission",
            direction: "desc",
          },
        });

      expect(result.data.length).toBe(2);
      expectToEqual(result.data, [
        { ...conventionD, ...differentAgencyFields, assessment: null },
        {
          ...conventionC,
          ...agencyFields,
          assessment: { status: "COMPLETED", endedWithAJob: false },
        },
      ]);
    });

    it("should filter by multiple criteria", async () => {
      const result =
        await conventionQueries.getPaginatedConventionsForAgencyUser({
          agencyUserId: validator.id,
          pagination: { page: 1, perPage: 10 },
          filters: {
            statuses: ["READY_TO_SIGN", "IN_REVIEW"],
            dateSubmission: {
              from: "2023-01-01",
              to: "2023-02-15",
            },
            search: "@convention-a.com",
          },
          sort: {
            by: "dateStart",
            direction: "desc",
          },
        });

      expect(result.data.length).toBe(1);
      expectToEqual(result.data, [
        { ...conventionA, ...agencyFields, assessment: null },
      ]);
    });

    it("should only return conventions from agencies the user belongs to", async () => {
      const result =
        await conventionQueries.getPaginatedConventionsForAgencyUser({
          agencyUserId: singleAgencyUser.id,
          pagination: { page: 1, perPage: 10 },
          sort: {
            by: "dateSubmission",
            direction: "desc",
          },
        });

      expectToEqual(result.data, [
        {
          ...conventionC,
          ...agencyFields,
          assessment: { status: "COMPLETED", endedWithAJob: false },
        },
        { ...conventionB, ...agencyFields, assessment: null },
        { ...conventionA, ...agencyFields, assessment: null },
      ]);

      const allConventionsBelongToUsersAgency = result.data.every(
        (convention) => convention.agencyId === agencyId,
      );
      expect(allConventionsBelongToUsersAgency).toBe(true);
    });

    it("should not return conventions if user has no appropriate role", async () => {
      const userWithoutProperRole = new ConnectedUserBuilder()
        .withEmail("no-proper-role@mail.com")
        .withId("99999999-9999-9999-9999-999999999999")
        .buildUser();

      await new PgUserRepository(db).save(userWithoutProperRole);

      // Get the existing agency
      const existingAgency = await agencyRepo.getById(agency.id);
      if (!existingAgency) throw new Error(`Agency ${agency.id} not found`);

      // Update the agency with the new user rights
      await agencyRepo.update({
        ...existingAgency,
        usersRights: {
          ...existingAgency.usersRights,
          [userWithoutProperRole.id]: {
            isNotifiedByEmail: true,
            roles: ["to-review"],
          },
        },
      });

      const result =
        await conventionQueries.getPaginatedConventionsForAgencyUser({
          agencyUserId: userWithoutProperRole.id,
          pagination: { page: 1, perPage: 10 },
          sort: {
            by: "dateSubmission",
            direction: "desc",
          },
        });

      expect(result.data.length).toBe(0);
      expectToEqual(result.data, []);
      expectToEqual(result.pagination, {
        currentPage: 1,
        totalPages: 1,
        numberPerPage: 10,
        totalRecords: 0,
      });
    });

    it("should filter conventions by agencyIds", async () => {
      const result =
        await conventionQueries.getPaginatedConventionsForAgencyUser({
          agencyUserId: validator.id,
          pagination: { page: 1, perPage: 10 },
          filters: { agencyIds: [agencyId] },
          sort: {
            by: "dateSubmission",
            direction: "desc",
          },
        });

      expect(result.data.length).toBe(3);
      expectToEqual(result.data, [
        {
          ...conventionC,
          ...agencyFields,
          assessment: { status: "COMPLETED", endedWithAJob: false },
        },
        { ...conventionB, ...agencyFields, assessment: null },
        { ...conventionA, ...agencyFields, assessment: null },
      ]);

      // Verify all returned conventions belong to the specified agency
      const allConventionsBelongToSpecifiedAgency = result.data.every(
        (convention) => convention.agencyId === agencyId,
      );
      expect(allConventionsBelongToSpecifiedAgency).toBe(true);
    });

    it("should filter conventions by multiple agencyIds", async () => {
      const result =
        await conventionQueries.getPaginatedConventionsForAgencyUser({
          agencyUserId: validator.id,
          pagination: { page: 1, perPage: 10 },
          filters: { agencyIds: [agencyId, differentAgencyId] },
          sort: {
            by: "dateSubmission",
            direction: "desc",
          },
        });

      expect(result.data.length).toBe(4);
      expectToEqual(result.data, [
        { ...conventionD, ...differentAgencyFields, assessment: null },
        {
          ...conventionC,
          ...agencyFields,
          assessment: { status: "COMPLETED", endedWithAJob: false },
        },
        { ...conventionB, ...agencyFields, assessment: null },
        { ...conventionA, ...agencyFields, assessment: null },
      ]);
    });

    it("should filter conventions by agencyIds combined with other filters", async () => {
      const result =
        await conventionQueries.getPaginatedConventionsForAgencyUser({
          agencyUserId: validator.id,
          pagination: { page: 1, perPage: 10 },
          filters: {
            agencyIds: [agencyId],
            statuses: ["READY_TO_SIGN"],
          },
          sort: {
            by: "dateSubmission",
            direction: "desc",
          },
        });

      expect(result.data.length).toBe(1);
      expectToEqual(result.data, [
        { ...conventionA, ...agencyFields, assessment: null },
      ]);
    });
  });
});
