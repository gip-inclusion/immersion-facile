import { addDays } from "date-fns";
import { Pool, PoolClient } from "pg";
import {
  AgencyDtoBuilder,
  AgencyId,
  AgencyKind,
  ConventionDtoBuilder,
  ConventionId,
  ConventionReadDto,
  ConventionStatus,
  DATE_START,
  expectArraysToEqualIgnoringOrder,
  expectToEqual,
  reasonableSchedule,
  SiretDto,
} from "shared";
import { getTestPgPool } from "../../../../_testBuilders/getTestPgPool";
import { makeCreateNewEvent } from "../../../../domain/core/eventBus/EventBus";
import { RealTimeGateway } from "../../core/TimeGateway/RealTimeGateway";
import { UuidV4Generator } from "../../core/UuidGeneratorImplementations";
import { KyselyDb, makeKyselyDb } from "../kysely/kyselyUtils";
import { PgAgencyRepository } from "./PgAgencyRepository";
import { PgConventionQueries } from "./PgConventionQueries";
import { PgConventionRepository } from "./PgConventionRepository";
import { PgOutboxRepository } from "./PgOutboxRepository";

const conventionIdA: ConventionId = "aaaaac99-9c0b-1aaa-aa6d-6bb9bd38aaaa";
const conventionIdB: ConventionId = "bbbbbc99-9c0b-1bbb-bb6d-6bb9bd38bbbb";
const agencyIdA: AgencyId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const agencyIdB: AgencyId = "bbbbbbbb-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

describe("Pg implementation of ConventionQueries", () => {
  let pool: Pool;
  let client: PoolClient;
  let conventionQueries: PgConventionQueries;
  let agencyRepo: PgAgencyRepository;
  let conventionRepository: PgConventionRepository;
  let transaction: KyselyDb;

  beforeAll(async () => {
    pool = getTestPgPool();
    client = await pool.connect();
  });

  beforeEach(async () => {
    await client.query("DELETE FROM conventions");
    await client.query(
      "TRUNCATE TABLE convention_external_ids RESTART IDENTITY;",
    );
    await client.query("DELETE FROM agencies");
    transaction = makeKyselyDb(pool);

    conventionQueries = new PgConventionQueries(transaction);
    agencyRepo = new PgAgencyRepository(transaction);
    conventionRepository = new PgConventionRepository(transaction);
  });

  afterAll(async () => {
    client.release();
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
      });

      // Act
      const result = await conventionQueries.getConventionById(conventionIdA);

      // Assert
      expectToEqual(result, expectedConventionRead);
    });
  });

  describe("PG implementation of method getConventionsByScope", () => {
    let poleEmploiConvention: ConventionReadDto;
    let cciConvention: ConventionReadDto;

    beforeEach(async () => {
      poleEmploiConvention = await insertAgencyAndConvention({
        conventionId: conventionIdA,
        agencyId: agencyIdA,
        agencyName: "agency PE",
        agencyDepartment: "75",
        agencyKind: "pole-emploi",
        agencySiret: "11112222000044",
        conventionStartDate: new Date("2021-01-10").toISOString(),
        conventionStatus: "IN_REVIEW",
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

        expectToEqual(result, [cciConvention, poleEmploiConvention]);
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

        expectToEqual(result, [poleEmploiConvention]);
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

        expectToEqual(result, [cciConvention, poleEmploiConvention]);
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

  describe("PG implementation of method getLatestUpdated", () => {
    it("Gets all saved conventionAdminDtos", async () => {
      // Prepare
      const insertedConventionReadDtos = await Promise.all([
        insertAgencyAndConvention({
          conventionId: conventionIdA,
          agencyId: conventionIdA,
          agencyName: "agency A",
          agencyDepartment: "75",
          agencyKind: "autre",
          agencySiret: "11112222000077",
        }),
        insertAgencyAndConvention({
          conventionId: conventionIdB,
          agencyId: conventionIdB,
          agencyName: "agency B",
          agencyDepartment: "76",
          agencyKind: "autre",
          agencySiret: "11112222000088",
        }),
      ]);
      // Act
      const resultAll = await conventionQueries.getLatestConventions({});

      // Assert
      expectArraysToEqualIgnoringOrder(resultAll, insertedConventionReadDtos);
    });

    it("Gets only convention of a given agency", async () => {
      // Prepare
      const insertedConventionReadDtos = await Promise.all([
        insertAgencyAndConvention({
          conventionId: conventionIdA,
          agencyId: conventionIdA,
          agencyName: "agency A",
          agencyDepartment: "75",
          agencyKind: "autre",
          agencySiret: "11112222000099",
        }),
        insertAgencyAndConvention({
          conventionId: conventionIdB,
          agencyId: conventionIdB,
          agencyName: "agency B",
          agencyDepartment: "76",
          agencyKind: "autre",
          agencySiret: "11112222000000",
        }),
      ]);

      // Act
      const resultAll = await conventionQueries.getLatestConventions({
        agencyId: conventionIdA,
      });

      // Assert
      expect(resultAll).toEqual([insertedConventionReadDtos[0]]);
    });
  });

  describe("PG implementation of method getConventionsByFilters", () => {
    const agencyId = "bbbbbc15-9c0a-1aaa-aa6d-6aa9ad38aaff";
    const agency = AgencyDtoBuilder.create().withId(agencyId).build();
    const conventionCancelledAndDateStart20230327 = new ConventionDtoBuilder()
      .withId("bbbbbc15-9c0a-1aaa-aa6d-6aa9ad38aa01")
      .withDateStart(new Date("2023-03-27").toISOString())
      .withDateEnd(new Date("2023-03-28").toISOString())
      .withSchedule(reasonableSchedule)
      .withStatus("READY_TO_SIGN")
      .withAgencyId(agencyId)
      .build();

    const conventionDraftAndDateStart20230330 = new ConventionDtoBuilder()
      .withId("bbbbbc15-9c0a-1aaa-aa6d-6aa9ad38aa02")
      .withDateStart(new Date("2023-03-30").toISOString())
      .withDateEnd(new Date("2023-03-31").toISOString())
      .withSchedule(reasonableSchedule)
      .withStatus("DRAFT")
      .withAgencyId(agencyId)
      .build();

    beforeEach(async () => {
      await agencyRepo.insert(agency);

      await Promise.all(
        [
          conventionCancelledAndDateStart20230327,
          conventionDraftAndDateStart20230330,
        ].map((params) => conventionRepository.save(params)),
      );
    });

    it(`getConventionsByFilters with filters :
          - withStatuses [READY_TO_SIGN]
        > expect 1 convention retreived`, async () => {
      // Act
      const resultAll = await conventionQueries.getConventionsByFilters({
        withStatuses: ["READY_TO_SIGN"],
      });

      // Assert
      expectToEqual(resultAll, [
        {
          ...conventionCancelledAndDateStart20230327,
          agencyDepartment: agency.address.departmentCode,
          agencyName: agency.name,
          agencyKind: agency.kind,
          agencySiret: agency.agencySiret,
        },
      ]);
    });

    it(`getConventionsByFilters with filters :
          - startDateGreater 2023-03-26
        > expect 2 convention retreived`, async () => {
      // Act
      const resultAll = await conventionQueries.getConventionsByFilters({
        startDateGreater: addDays(
          new Date(conventionCancelledAndDateStart20230327.dateStart),
          -1,
        ),
      });

      // Assert
      expectToEqual(resultAll, [
        {
          ...conventionDraftAndDateStart20230330,
          agencyDepartment: agency.address.departmentCode,
          agencyName: agency.name,
          agencyKind: agency.kind,
          agencySiret: agency.agencySiret,
        },
        {
          ...conventionCancelledAndDateStart20230327,
          agencyDepartment: agency.address.departmentCode,
          agencyName: agency.name,
          agencyKind: agency.kind,
          agencySiret: agency.agencySiret,
        },
      ]);
    });

    it(`getConventionsByFilters with filters :
          - startDateLessOrEqual 2023-03-27
        > expect 1 convention retreived`, async () => {
      // Act
      const resultAll = await conventionQueries.getConventionsByFilters({
        startDateLessOrEqual: new Date(
          conventionCancelledAndDateStart20230327.dateStart,
        ),
      });

      // Assert
      expectToEqual(resultAll, [
        {
          ...conventionCancelledAndDateStart20230327,
          agencyDepartment: agency.address.departmentCode,
          agencyName: agency.name,
          agencyKind: agency.kind,
          agencySiret: agency.agencySiret,
        },
      ]);
    });

    it(`getConventionsByFilters with filters:
          - startDateGreater 2023-03-26
          - startDateLessOrEqual 2023-03-27
          - withStatuses ["READY_TO_SIGN"]
        > expect 1 convention retreived`, async () => {
      // Act
      const resultAll = await conventionQueries.getConventionsByFilters({
        startDateGreater: addDays(
          new Date(conventionCancelledAndDateStart20230327.dateStart),
          -1,
        ),
        startDateLessOrEqual: new Date(
          conventionCancelledAndDateStart20230327.dateStart,
        ),
        withStatuses: [conventionCancelledAndDateStart20230327.status],
      });

      // Assert
      expectToEqual(resultAll, [
        {
          ...conventionCancelledAndDateStart20230327,
          agencyDepartment: agency.address.departmentCode,
          agencyName: agency.name,
          agencyKind: agency.kind,
          agencySiret: agency.agencySiret,
        },
      ]);
    });

    it(`getConventionsByFilters with:
          - startDateGreater 2023-03-30'
          - startDateLessOrEqual 2023-03-31
        > expect 0 convention retreived`, async () => {
      // Act
      const resultAll = await conventionQueries.getConventionsByFilters({
        startDateGreater: new Date("2023-03-30"),
        startDateLessOrEqual: new Date("2023-03-31"),
      });

      // Assert
      expectToEqual(resultAll, []);
    });
  });

  describe("PG implementation of method getAllConventionsForThoseEndingThatDidntReceivedAssessmentLink", () => {
    const agency = AgencyDtoBuilder.create().build();
    beforeEach(async () => {
      const agencyRepository = new PgAgencyRepository(transaction);
      await agencyRepository.insert(agency);
      await client.query("DELETE FROM outbox_failures");
      await client.query("DELETE FROM outbox_publications");
      await client.query("DELETE FROM outbox");
    });

    it("Gets all email params of validated immersions ending at given date that did not received any assessment link yet", async () => {
      // Prepare : insert an immersion ending the 14/05/2022 and two others ending the 15/05/2022 amongst which one already received an assessment link.
      const conventionRepo = new PgConventionRepository(transaction);
      const outboxRepo = new PgOutboxRepository(transaction);
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
      const validatedImmersionEndingThe15thThatAlreadyReceivedAnEmail =
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
        .withDateStart("2022-05-10")
        .withDateEnd("2022-05-15")
        .withSchedule(reasonableSchedule)
        .withStatus("IN_REVIEW")
        .build();
      await Promise.all(
        [
          validatedImmersionEndingThe14th,
          validatedImmersionEndingThe15thThatAlreadyReceivedAnEmail,
          validatedImmersionEndingThe15th,
          ongoingImmersionEndingThe15th,
        ].map((params) => conventionRepo.save(params)),
      );

      const createNewEvent = makeCreateNewEvent({
        timeGateway: new RealTimeGateway(),
        uuidGenerator: new UuidV4Generator(),
      });
      const eventEmailSentToImmersion1 = createNewEvent({
        topic: "EmailWithLinkToCreateAssessmentSent",
        payload: {
          id: validatedImmersionEndingThe15thThatAlreadyReceivedAnEmail.id,
        },
      });
      await outboxRepo.save(eventEmailSentToImmersion1);

      // Act
      const queryResults =
        await conventionQueries.getAllConventionsForThoseEndingThatDidntReceivedAssessmentLink(
          new Date("2022-05-15"),
        );

      // Assert
      expectToEqual(queryResults, [
        {
          ...validatedImmersionEndingThe15th,
          agencyName: agency.name,
          agencyDepartment: agency.address.departmentCode,
          agencyKind: agency.kind,
          agencySiret: agency.agencySiret,
        },
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
    conventionStartDate = DATE_START,
    conventionStatus = "DRAFT",
  }: {
    conventionId: ConventionId;
    agencyId: string;
    agencyName: string;
    agencyDepartment: string;
    agencyKind: AgencyKind;
    agencySiret: SiretDto;
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
        phone: "0011223344",
        role: "beneficiary",
        birthdate: "1990-02-21T00:00:00.000Z",
        emergencyContact: "Billy",
        emergencyContactPhone: "0011223344",
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
        phone: "0011223344",
        role: "beneficiary-current-employer",
        signedAt: new Date().toISOString(),
        businessAddress: "Rue des Bouchers 67065 Strasbourg",
      })
      .withBeneficiaryRepresentative({
        email: "rep@rep.com",
        firstName: "beneficiary",
        lastName: "Rep",
        phone: "0011223344",
        role: "beneficiary-representative",
        signedAt: new Date().toISOString(),
      })
      .withEstablishmentRepresentative({
        email: "est@rep.com",
        firstName: "Establishment",
        lastName: "Rep",
        phone: "0011223344",
        role: "establishment-representative",
        signedAt: new Date().toISOString(),
      })
      .withDateStart(conventionStartDate)
      .build();

    await agencyRepo.insert(
      AgencyDtoBuilder.create()
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
        .build(),
    );

    await conventionRepository.save(convention);
    return {
      ...convention,
      agencyName,
      agencyDepartment,
      agencyKind,
      agencySiret,
    };
  };
});
