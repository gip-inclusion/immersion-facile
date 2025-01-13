import { addDays, addHours, parseISO } from "date-fns";
import subDays from "date-fns/subDays";
import { sql } from "kysely";
import { Pool } from "pg";
import {
  AgencyDto,
  AgencyDtoBuilder,
  AgencyId,
  AgencyKind,
  AppellationCode,
  ConventionDto,
  ConventionDtoBuilder,
  ConventionId,
  ConventionReadDto,
  ConventionStatus,
  DATE_START,
  EmailNotification,
  InclusionConnectedUserBuilder,
  Notification,
  SiretDto,
  concatValidatorNames,
  expectArraysToEqualIgnoringOrder,
  expectToEqual,
  reasonableSchedule,
} from "shared";
import { KyselyDb, makeKyselyDb } from "../../../config/pg/kysely/kyselyUtils";
import { getTestPgPool } from "../../../config/pg/pgUtils";
import { toAgencyWithRights } from "../../../utils/agency";
import { PgAgencyRepository } from "../../agency/adapters/PgAgencyRepository";
import { PgUserRepository } from "../../core/authentication/inclusion-connect/adapters/PgUserRepository";
import { UserOnRepository } from "../../core/authentication/inclusion-connect/port/UserRepository";
import { PgNotificationRepository } from "../../core/notifications/adapters/PgNotificationRepository";
import { NotificationRepository } from "../../core/notifications/ports/NotificationRepository";
import { ConventionRepository } from "../ports/ConventionRepository";
import { PgConventionQueries } from "./PgConventionQueries";
import { PgConventionRepository } from "./PgConventionRepository";

describe("Pg implementation of ConventionQueries", () => {
  const conventionIdA: ConventionId = "aaaaac99-9c0b-1aaa-aa6d-6bb9bd38aaaa";
  const conventionIdB: ConventionId = "bbbbbc99-9c0b-1bbb-bb6d-6bb9bd38bbbb";
  const agencyIdA: AgencyId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
  const agencyIdB: AgencyId = "bbbbbbbb-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

  const createNotification = ({
    id,
    createdAt,
    convention,
    emailKind,
  }: {
    id: string;
    createdAt: Date;
    convention: ConventionDto;
    emailKind:
      | "ASSESSMENT_ESTABLISHMENT_NOTIFICATION"
      | "VALIDATED_CONVENTION_FINAL_CONFIRMATION";
  }): EmailNotification => {
    return emailKind === "ASSESSMENT_ESTABLISHMENT_NOTIFICATION"
      ? {
          createdAt: createdAt.toISOString(),
          followedIds: {
            conventionId: convention.id,
            establishmentSiret: convention.siret,
            agencyId: convention.agencyId,
          },
          id,
          kind: "email",
          templatedContent: {
            kind: "ASSESSMENT_ESTABLISHMENT_NOTIFICATION",
            params: {
              internshipKind: "immersion",
              assessmentCreationLink: "fake-link",
              beneficiaryFirstName: "joe",
              beneficiaryLastName: "joe",
              conventionId: convention.id,
              establishmentTutorName: "tuteur du joe",
              agencyLogoUrl: "https://super link",
            },
            recipients: ["joe-joe@gmail.com"],
          },
        }
      : {
          createdAt: createdAt.toISOString(),
          followedIds: {
            conventionId: convention.id,
            establishmentSiret: convention.siret,
            agencyId: convention.agencyId,
          },
          id,
          kind: "email",
          templatedContent: {
            kind: "VALIDATED_CONVENTION_FINAL_CONFIRMATION",
            params: {
              conventionId: convention.id,
              internshipKind: convention.internshipKind,
              beneficiaryFirstName: "prénom béneficiaire",
              beneficiaryLastName: "nom béneficiaire",
              beneficiaryBirthdate: "1995-05-05",
              dateStart: parseISO(convention.dateStart).toLocaleDateString(
                "fr",
              ),
              dateEnd: parseISO(convention.dateEnd).toLocaleDateString("fr"),
              establishmentTutorName: `${convention.establishmentTutor.firstName} ${convention.establishmentTutor.lastName}`,
              businessName: convention.businessName,
              immersionAppellationLabel:
                convention.immersionAppellation.appellationLabel,
              emergencyContactInfos: "",
              agencyLogoUrl: "https://super link",
              agencyAssessmentDocumentLink: "https://super link",
              magicLink: "",
              validatorName: convention.validators?.agencyValidator
                ? concatValidatorNames(convention.validators?.agencyValidator)
                : "",
            },
            recipients: ["joe-joe@gmail.com"],
          },
        };
  };

  const validator = new InclusionConnectedUserBuilder()
    .withEmail("validator@mail.com")
    .withId("77777777-6666-4777-7777-777777777777")
    .buildUser();

  let pool: Pool;
  let conventionQueries: PgConventionQueries;
  let agencyRepo: PgAgencyRepository;

  let conventionRepository: PgConventionRepository;
  let db: KyselyDb;

  beforeAll(async () => {
    pool = getTestPgPool();
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

    conventionQueries = new PgConventionQueries(db);
    agencyRepo = new PgAgencyRepository(db);
    conventionRepository = new PgConventionRepository(db);

    await new PgUserRepository(db).save(validator, "inclusionConnect");
  });

  afterAll(async () => {
    await pool.end();
  });

  describe("PG implementation of method getConventionById", () => {
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
        validatorUser: validator,
      });

      // Act
      const result = await conventionQueries.getConventionById(conventionIdA);

      // Assert
      expectToEqual(result, expectedConventionRead);
    });

    it("Retrieves a convention by id exists with refersToAgency", async () => {
      const refersToAgencyId = "bbbbbc99-9c0b-1bbb-bb6d-6bb9bd38bbbb";
      const referringAgency = new AgencyDtoBuilder()
        .withName("Agence référente")
        .withId(refersToAgencyId)
        .withAgencySiret("55552222000055")
        .build();

      await agencyRepo.insert(toAgencyWithRights(referringAgency, {}));

      const expectedConventionRead = await insertAgencyAndConvention({
        conventionId: conventionIdA,
        agencyId: conventionIdA,
        agencyName: "Agency A",
        agencyDepartment: "75",
        agencyKind: "autre",
        agencySiret: "11112222000033",
        withRefersToAgency: referringAgency,
        validatorUser: validator,
      });

      const result = await conventionQueries.getConventionById(conventionIdA);
      expectToEqual(result, expectedConventionRead);
    });
  });

  describe("PG implementation of method getConventionsByScope", () => {
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
        conventionStatus: "DRAFT",
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

  describe("PG implementation of method getConventionsByFilters", () => {
    const agencyId = "bbbbbc15-9c0a-1aaa-aa6d-6aa9ad38aaff";
    const agency = AgencyDtoBuilder.create().withId(agencyId).build();
    const siret1 = "11110000111100";
    const siret2 = "22220000222200";
    const siret3 = "33330000333300";

    const conventionCancelledAndDateStart20230327 = new ConventionDtoBuilder()
      .withSiret(siret1)
      .withId("bbbbbc15-9c0a-1aaa-aa6d-6aa9ad38aa01")
      .withDateStart(new Date("2023-03-27").toISOString())
      .withDateEnd(new Date("2023-03-28").toISOString())
      .withSchedule(reasonableSchedule)
      .withStatus("READY_TO_SIGN")
      .withAgencyId(agencyId)
      .build();

    const conventionDraftAndDateStart20230330 = new ConventionDtoBuilder()
      .withSiret(siret3)
      .withId("bbbbbc15-9c0a-1aaa-aa6d-6aa9ad38aa02")
      .withDateSubmission(new Date("2023-03-05").toISOString())
      .withDateStart(new Date("2023-03-30").toISOString())
      .withDateEnd(new Date("2023-03-31").toISOString())
      .withSchedule(reasonableSchedule)
      .withStatus("DRAFT")
      .withAgencyId(agencyId)
      .build();

    const firstValidatedConvention = new ConventionDtoBuilder()
      .withSiret(siret1)
      .withId("bbbbbc15-9c0a-1aaa-aa6d-6aa9ad38aa03")
      .withDateSubmission(new Date("2024-06-20").toISOString())
      .withDateStart(new Date("2024-07-01").toISOString())
      .withDateEnd(new Date("2024-07-02").toISOString())
      .withSchedule(reasonableSchedule)
      .withStatus("ACCEPTED_BY_VALIDATOR")
      .validated()
      .withDateValidation(new Date("2024-06-25").toISOString())
      .withAgencyId(agencyId)
      .build();

    const secondValidatedConvention = new ConventionDtoBuilder()
      .withSiret(siret2)
      .withId("bbbbbc15-9c0a-1aaa-aa6d-6aa9ad38aa04")
      .withDateSubmission(new Date("2024-06-21").toISOString())
      .withDateStart(new Date("2024-07-02").toISOString())
      .withDateEnd(new Date("2024-07-03").toISOString())
      .withSchedule(reasonableSchedule)
      .withStatus("ACCEPTED_BY_VALIDATOR")
      .validated()
      .withDateValidation(new Date("2024-06-29").toISOString())
      .withAgencyId(agencyId)
      .build();

    beforeEach(async () => {
      await agencyRepo.insert(toAgencyWithRights(agency));

      await Promise.all(
        [
          conventionCancelledAndDateStart20230327,
          conventionDraftAndDateStart20230330,
          firstValidatedConvention,
          secondValidatedConvention,
        ].map((params) => conventionRepository.save(params)),
      );
    });

    it(`getConventionsByFilters with filters :
          - dateSubmissionEqual
        > expect 1 convention retrieved`, async () => {
      // Act
      const resultAll = await conventionQueries.getConventions({
        filters: {
          dateSubmissionEqual: new Date(
            conventionCancelledAndDateStart20230327.dateSubmission,
          ),
        },
        sortBy: "dateStart",
      });

      // Assert
      expectToEqual(resultAll, [conventionCancelledAndDateStart20230327]);
    });

    it(`getConventionsByFilters with filters :
          - withStatuses [READY_TO_SIGN]
        > expect 1 convention retreived`, async () => {
      // Act
      const resultAll = await conventionQueries.getConventions({
        filters: {
          withStatuses: ["READY_TO_SIGN"],
        },
        sortBy: "dateStart",
      });

      // Assert
      expectToEqual(resultAll, [conventionCancelledAndDateStart20230327]);
    });

    it(`getConventionsByFilters with filters :
          - startDateGreater 2023-03-26
        > expect 2 convention retreived`, async () => {
      // Act
      const resultAll = await conventionQueries.getConventions({
        filters: {
          startDateGreater: addDays(
            new Date(conventionCancelledAndDateStart20230327.dateStart),
            -1,
          ),
        },
        sortBy: "dateStart",
      });

      // Assert
      expectToEqual(resultAll, [
        secondValidatedConvention,
        firstValidatedConvention,
        conventionDraftAndDateStart20230330,
        conventionCancelledAndDateStart20230327,
      ]);
    });

    it(`getConventionsByFilters with filters :
          - startDateLessOrEqual 2023-03-27
        > expect 1 convention retreived`, async () => {
      // Act
      const resultAll = await conventionQueries.getConventions({
        filters: {
          startDateLessOrEqual: new Date(
            conventionCancelledAndDateStart20230327.dateStart,
          ),
        },
        sortBy: "dateStart",
      });

      // Assert
      expectToEqual(resultAll, [conventionCancelledAndDateStart20230327]);
    });

    it(`getConventionsByFilters with filters:
          - startDateGreater 2023-03-26
          - startDateLessOrEqual 2023-03-27
          - withStatuses ["READY_TO_SIGN"]
        > expect 1 convention retreived`, async () => {
      // Act
      const resultAll = await conventionQueries.getConventions({
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
      });

      // Assert
      expectToEqual(resultAll, [conventionCancelledAndDateStart20230327]);
    });

    it(`getConventionsByFilters with:
          - startDateGreater 2023-03-30'
          - startDateLessOrEqual 2023-03-31
        > expect 0 convention retreived`, async () => {
      // Act
      const resultAll = await conventionQueries.getConventions({
        filters: {
          startDateGreater: new Date("2023-03-30"),
          startDateLessOrEqual: new Date("2023-03-31"),
        },
        sortBy: "dateStart",
      });

      // Assert
      expectToEqual(resultAll, []);
    });

    it(`getConventionsByFilters with:
      - withStatuses ["ACCEPTED-BY-VALIDATOR"]
      - sort by "date_validation"
    > expect 2 convention retreived`, async () => {
      // Act
      const resultAll = await conventionQueries.getConventions({
        filters: {
          withStatuses: [firstValidatedConvention.status],
        },
        sortBy: "dateValidation",
      });

      // Assert
      expectToEqual(resultAll, [
        secondValidatedConvention,
        firstValidatedConvention,
      ]);
    });

    it("getConventionsByFilters with some sirets", async () => {
      const resultAll = await conventionQueries.getConventions({
        filters: {
          withSirets: [siret1, siret2],
        },
        sortBy: "dateStart",
      });

      expectToEqual(resultAll, [
        secondValidatedConvention,
        firstValidatedConvention,
        conventionCancelledAndDateStart20230327,
      ]);
    });
  });

  describe("findSimilarConventions", () => {
    const matchingSiret: SiretDto = "11112222333344";
    const matchingAppellation: AppellationCode = "140927";
    const matchingBirthDate = new Date("1992-01-01").toISOString();
    const matchingBeneficiaryLastname = "Dupont";
    const matchingDateStart = new Date("2021-01-09").toISOString();
    const someMatchingStatus = "DRAFT";
    const conventionMatchingIdA: ConventionId =
      "aaaa1111-1111-4111-1111-11111111aaaa";
    const conventionMatchingIdB: ConventionId =
      "bbbb1111-1111-4111-1111-11111111bbbb";

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
        .withId("22222222-2222-4222-2222-222222222222")
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

  describe("PG implementation of method getAllConventionsForThoseEndingThatDidntReceivedAssessmentLink", () => {
    const agency = AgencyDtoBuilder.create().build();
    const dateStart = new Date("2022-05-10").toISOString();
    const dateEnd14 = new Date("2022-05-14").toISOString();
    const dateEnd15 = new Date("2022-05-15").toISOString();
    const validatedImmersionEndingThe14th = new ConventionDtoBuilder()
      .withId("aaaaac14-9c0a-1aaa-aa6d-6aa9ad38aaaa")
      .validated()
      .withDateStart(dateStart)
      .withDateEnd(dateEnd14)
      .withSchedule(reasonableSchedule)
      .build();

    const validatedImmersionEndingThe15thThatAlreadyReceivedAnAssessmentEmail =
      new ConventionDtoBuilder()
        .withId("aaaaac15-9c0a-1aaa-aa6d-6aa9ad38aaaa")
        .validated()
        .withDateStart(dateStart)
        .withDateEnd(dateEnd15)
        .withSchedule(reasonableSchedule)
        .build();

    const validatedImmersionEndingThe15th = new ConventionDtoBuilder()
      .withId("bbbbbc15-9c0a-1aaa-aa6d-6aa9ad38aaaa")
      .validated()
      .withDateStart(dateStart)
      .withDateEnd(dateEnd15)
      .withSchedule(reasonableSchedule)
      .withEstablishmentTutorFirstName("Romain")
      .withEstablishmentTutorLastName("Grandjean")
      .build();

    const ongoingImmersionEndingThe15th = new ConventionDtoBuilder()
      .withId("cccccc15-9c0a-1aaa-aa6d-6aa9ad38aaaa")
      .withDateStart(dateStart)
      .withDateEnd(dateEnd15)
      .withSchedule(reasonableSchedule)
      .withStatus("IN_REVIEW")
      .build();

    const assessmentNotification: Notification = createNotification({
      id: "77770000-0000-4777-7777-000077770000",
      createdAt: subDays(new Date(dateEnd15), 1),
      convention:
        validatedImmersionEndingThe15thThatAlreadyReceivedAnAssessmentEmail,
      emailKind: "ASSESSMENT_ESTABLISHMENT_NOTIFICATION",
    });
    const conventionValidateEndingThe14thNotification: Notification =
      createNotification({
        id: "77770000-0000-4777-7777-000077770001",
        createdAt: subDays(new Date(dateEnd14), 7),
        convention: validatedImmersionEndingThe14th,
        emailKind: "VALIDATED_CONVENTION_FINAL_CONFIRMATION",
      });
    const conventionValidateEndingThe15thNotification: Notification =
      createNotification({
        id: "77770000-0000-4777-7777-000077770002",
        createdAt: subDays(new Date(dateEnd15), 7),
        convention:
          validatedImmersionEndingThe15thThatAlreadyReceivedAnAssessmentEmail,
        emailKind: "VALIDATED_CONVENTION_FINAL_CONFIRMATION",
      });
    const conventionValidateEndingThe15thNotification2: Notification =
      createNotification({
        id: "77770000-0000-4777-7777-000077770003",
        createdAt: subDays(new Date(dateEnd15), 7),
        convention: validatedImmersionEndingThe15th,
        emailKind: "VALIDATED_CONVENTION_FINAL_CONFIRMATION",
      });
    const ongoingConventionValidateEndingThe15thNotification2: Notification =
      createNotification({
        id: "77770000-0000-4777-7777-000077770004",
        createdAt: subDays(new Date(dateEnd15), 7),
        convention: ongoingImmersionEndingThe15th,
        emailKind: "VALIDATED_CONVENTION_FINAL_CONFIRMATION",
      });

    let conventionRepo: ConventionRepository;
    let notificationRepo: NotificationRepository;

    beforeEach(async () => {
      const agencyRepository = new PgAgencyRepository(db);
      await agencyRepository.insert(toAgencyWithRights(agency));

      conventionRepo = new PgConventionRepository(db);
      notificationRepo = new PgNotificationRepository(db);

      await Promise.all(
        [
          validatedImmersionEndingThe14th,
          validatedImmersionEndingThe15thThatAlreadyReceivedAnAssessmentEmail,
          validatedImmersionEndingThe15th,
          ongoingImmersionEndingThe15th,
        ].map((params) => conventionRepo.save(params)),
      );
      await notificationRepo.saveBatch([
        assessmentNotification,
        conventionValidateEndingThe14thNotification,
        conventionValidateEndingThe15thNotification,
        conventionValidateEndingThe15thNotification2,
        ongoingConventionValidateEndingThe15thNotification2,
      ]);
    });

    it("Gets all conventions of validated immersions ending at given date that did not receive any assessment link yet", async () => {
      // Act
      const date = new Date("2022-05-15T12:43:11");
      const queryResults =
        await conventionQueries.getAllConventionsForThoseEndingThatDidntGoThrough(
          {
            from: date,
            to: addHours(date, 24),
          },
          "ASSESSMENT_ESTABLISHMENT_NOTIFICATION",
        );

      // Assert
      expectToEqual(queryResults, [validatedImmersionEndingThe15th]);
    });

    it("Gets all conventions of validated conventions that are already passed but has been ACCEPTED_BY_VALIDATOR at a later date", async () => {
      const validationDate = new Date("2022-05-20T12:43:11");
      const futureConvention = new ConventionDtoBuilder()
        .withId("bbbbbc15-9c0a-1aaa-aa6d-6aa9ad38aad0")
        .validated()
        .withDateStart(addDays(validationDate, 2).toISOString())
        .withDateEnd(addDays(validationDate, 4).toISOString())
        .withSchedule(reasonableSchedule)
        .withEstablishmentTutorFirstName("Romain")
        .withEstablishmentTutorLastName("Grandjean")
        .build();
      const futureConventionNotification: Notification = createNotification({
        id: "77770000-0000-4777-7773-000077770000",
        createdAt: validationDate,
        convention: futureConvention,
        emailKind: "VALIDATED_CONVENTION_FINAL_CONFIRMATION",
      });
      const pastConvention = new ConventionDtoBuilder()
        .withId("bbbbbc15-9c0a-1aaa-aa6d-6aa9ad38aad5")
        .validated()
        .withDateStart(dateStart)
        .withDateEnd(dateEnd15)
        .withSchedule(reasonableSchedule)
        .withEstablishmentTutorFirstName("Romain")
        .withEstablishmentTutorLastName("Grandjean")
        .build();
      const pastConventionNotification: Notification = createNotification({
        id: "77770000-0000-4777-7777-000077770005",
        createdAt: validationDate,
        convention: pastConvention,
        emailKind: "VALIDATED_CONVENTION_FINAL_CONFIRMATION",
      });
      await conventionRepo.save(pastConvention);
      await conventionRepo.save(futureConvention);
      await notificationRepo.save(pastConventionNotification);
      await notificationRepo.save(futureConventionNotification);

      const queryResults =
        await conventionQueries.getAllConventionsForThoseEndingThatDidntGoThrough(
          {
            from: subDays(validationDate, 5),
            to: addHours(validationDate, 24),
          },
          "ASSESSMENT_ESTABLISHMENT_NOTIFICATION",
        );

      expectArraysToEqualIgnoringOrder(queryResults, [
        validatedImmersionEndingThe15th,
        pastConvention,
      ]);
    });

    it("Gets all conventions of validated conventions that are already passed but has been ACCEPTED_BY_VALIDATOR today", async () => {
      const today = new Date("2022-05-20T12:43:11");
      const tomorrow = new Date("2022-05-21T12:43:11");
      const pastConvention = new ConventionDtoBuilder()
        .withId("bbbbbc15-9c0a-1aaa-aa6d-6aa9ad38aad5")
        .validated()
        .withDateStart(dateStart)
        .withDateEnd(dateEnd15)
        .withSchedule(reasonableSchedule)
        .withEstablishmentTutorFirstName("Romain")
        .withEstablishmentTutorLastName("Grandjean")
        .build();
      const pastConventionNotification: Notification = createNotification({
        id: "77770000-0000-4777-7777-000077770005",
        createdAt: today,
        convention: pastConvention,
        emailKind: "VALIDATED_CONVENTION_FINAL_CONFIRMATION",
      });
      await conventionRepo.save(pastConvention);
      await notificationRepo.save(pastConventionNotification);

      const queryResults =
        await conventionQueries.getAllConventionsForThoseEndingThatDidntGoThrough(
          {
            from: tomorrow,
            to: addHours(tomorrow, 24),
          },
          "ASSESSMENT_ESTABLISHMENT_NOTIFICATION",
        );

      expectArraysToEqualIgnoringOrder(queryResults, [pastConvention]);
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
    conventionStatus = "DRAFT",
    validatorUser,
  }: {
    conventionId: ConventionId;
    agencyId: string;
    agencyName: string;
    agencyDepartment: string;
    agencyKind: AgencyKind;
    agencySiret: SiretDto;
    validatorUser: UserOnRepository;
    withRefersToAgency?: AgencyDto;
    conventionStartDate?: string;
    conventionStatus?: ConventionStatus;
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
      await agencyRepo.insert(toAgencyWithRights(withRefersToAgency));

    await agencyRepo.insert(
      toAgencyWithRights(agency, {
        [validatorUser.id]: { isNotifiedByEmail: true, roles: ["validator"] },
      }),
    );

    await conventionRepository.save(convention);

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
    } satisfies ConventionReadDto;
  };
});
