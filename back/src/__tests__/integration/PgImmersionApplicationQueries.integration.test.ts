import { Pool, PoolClient } from "pg";
import { PgAgencyRepository } from "../../adapters/secondary/pg/PgAgencyRepository";
import { PgImmersionApplicationQueries } from "../../adapters/secondary/pg/PgImmersionApplicationQueries";
import { PgImmersionApplicationRepository } from "../../adapters/secondary/pg/PgImmersionApplicationRepository";
import { ImmersionApplicationEntity } from "../../domain/immersionApplication/entities/ImmersionApplicationEntity";
import { ImmersionApplicationId } from "shared/src/ImmersionApplication/ImmersionApplication.dto";
import { AgencyBuilder } from "shared/src/agency/AgencyBuilder";
import { getTestPgPool } from "../../_testBuilders/getTestPgPool";
import { ImmersionApplicationDtoBuilder } from "shared/src/ImmersionApplication/ImmersionApplicationDtoBuilder";
import { ImmersionApplicationRawBeforeExportVO } from "../../domain/immersionApplication/valueObjects/ImmersionApplicationRawBeforeExportVO";
import { ImmersionApplicationEntityBuilder } from "../../_testBuilders/ImmersionApplicationEntityBuilder";
import { PgOutboxRepository } from "../../adapters/secondary/pg/PgOutboxRepository";
import { makeCreateNewEvent } from "../../domain/core/eventBus/EventBus";
import { RealClock } from "../../adapters/secondary/core/ClockImplementations";
import { UuidV4Generator } from "../../adapters/secondary/core/UuidGeneratorImplementations";
import { ImmersionAssessmentEmailParams } from "../../domain/immersionOffer/useCases/SendEmailsWithAssessmentCreationLink";

describe("Pg implementation of ImmersionApplicationQueries", () => {
  let pool: Pool;
  let client: PoolClient;
  let immersionApplicationQueries: PgImmersionApplicationQueries;
  let agencyRepo: PgAgencyRepository;
  let immersionApplicationRepo: PgImmersionApplicationRepository;

  beforeAll(async () => {
    pool = getTestPgPool();
    client = await pool.connect();
  });

  beforeEach(async () => {
    await client.query("DELETE FROM immersion_applications");
    await client.query("DELETE FROM agencies");
    immersionApplicationQueries = new PgImmersionApplicationQueries(client);
    agencyRepo = new PgAgencyRepository(client);
    immersionApplicationRepo = new PgImmersionApplicationRepository(client);
  });

  afterAll(async () => {
    client.release();
    await pool.end();
  });
  describe("get for export", () => {
    it("retrieves all immersion applications exports", async () => {
      // Prepare
      const appleAgencyId = "11111111-1111-1111-1111-111111111111";
      const appleAgency = AgencyBuilder.create(appleAgencyId)
        .withName("apple")
        .build();

      const immersionApplicationId: ImmersionApplicationId =
        "aaaaac99-9c0b-aaaa-aa6d-6bb9bd38aaaa";

      const immersionApplicationEntity: ImmersionApplicationEntity =
        ImmersionApplicationEntity.create(
          new ImmersionApplicationDtoBuilder()
            .withId(immersionApplicationId)
            .withDateStart(new Date("2021-01-15").toISOString())
            .withDateEnd(new Date("2021-01-20").toISOString())
            .withDateSubmission(new Date("2021-01-10").toISOString())
            .withAgencyId(appleAgencyId)
            .withoutWorkCondition()
            .build(),
        );

      await agencyRepo.insert(appleAgency);
      await immersionApplicationRepo.save(immersionApplicationEntity);

      // Act
      const actualExport: ImmersionApplicationRawBeforeExportVO[] =
        await immersionApplicationQueries.getAllApplicationsForExport();

      const {
        agencyId,
        id,
        immersionActivities,
        immersionSkills,
        individualProtection,
        sanitaryPrevention,
        sanitaryPreventionDescription,
        immersionAppellation,
        ...filteredProperties
      } = immersionApplicationEntity.properties;
      // Assert
      expect(actualExport[0]._props).toStrictEqual(
        new ImmersionApplicationRawBeforeExportVO({
          ...filteredProperties,
          agencyName: appleAgency.name,
          immersionProfession:
            immersionApplicationEntity.properties.immersionAppellation
              .appellationLabel,
          status: immersionApplicationEntity.status,
          dateEnd: new Date("2021-01-20").toISOString(),
          dateStart: new Date("2021-01-15").toISOString(),
          dateSubmission: new Date("2021-01-10").toISOString(),
        })._props,
      );
    });
  });
  describe("PG implementation of method getLatestUpdated", () => {
    beforeEach(async () => {
      const agencyRepository = new PgAgencyRepository(client);
      await agencyRepository.insert(AgencyBuilder.create().build());
    });
    it("Gets saved immersion", async () => {
      const idA: ImmersionApplicationId =
        "aaaaac99-9c0b-aaaa-aa6d-6bb9bd38aaaa";
      const immersionApplicationEntityA =
        new ImmersionApplicationEntityBuilder().withId(idA).build();

      const idB: ImmersionApplicationId =
        "bbbbbc99-9c0b-bbbb-bb6d-6bb9bd38bbbb";
      const immersionApplicationEntityB =
        new ImmersionApplicationEntityBuilder().withId(idB).build();

      await immersionApplicationRepo.save(immersionApplicationEntityA);
      await immersionApplicationRepo.save(immersionApplicationEntityB);

      const resultA = await immersionApplicationRepo.getById(idA);
      expect(resultA).toEqual(immersionApplicationEntityA);

      const resultAll = await immersionApplicationQueries.getLatestUpdated();
      expect(resultAll).toEqual([
        immersionApplicationEntityB,
        immersionApplicationEntityA,
      ]);
    });
  });

  describe("PG implementation of method getAllImmersionAssessmentEmailParamsForThoseEndingThatDidntReceivedAssessmentLink", () => {
    beforeEach(async () => {
      const agencyRepository = new PgAgencyRepository(client);
      await agencyRepository.insert(AgencyBuilder.create().build());
      await client.query("DELETE FROM outbox_failures");
      await client.query("DELETE FROM outbox_publications");
      await client.query("DELETE FROM outbox");
    });
    it("Gets all email params of immersion ending at given date that did not received any assessment link yet", async () => {
      // Prepare : insert an immersion ending the 14/05/2022 and two others ending the 15/05/2022 amongst which one already received an assessment link.
      const immersionApplicationRepo = new PgImmersionApplicationRepository(
        client,
      );
      const outboxRepo = new PgOutboxRepository(client);
      const immersionEndingThe14th = new ImmersionApplicationEntityBuilder()
        .withId("aaaaac14-9c0a-aaaa-aa6d-6aa9ad38aaaa")
        .withDateStartAndDateEnd("2022-05-01", "2022-05-14")
        .build();
      const immersion1EndingThe15th = new ImmersionApplicationEntityBuilder()
        .withId("aaaaac15-9c0a-aaaa-aa6d-6aa9ad38aaaa")
        .withDateStartAndDateEnd("2022-05-01", "2022-05-15")
        .build();
      const immersion2EndingThe15th = new ImmersionApplicationEntityBuilder()
        .withId("bbbbbc15-9c0a-aaaa-aa6d-6aa9ad38aaaa")
        .withDateStartAndDateEnd("2022-05-01", "2022-05-15")
        .build();
      await Promise.all(
        [
          immersionEndingThe14th,
          immersion1EndingThe15th,
          immersion2EndingThe15th,
        ].map((params) => immersionApplicationRepo.save(params)),
      );

      const createNewEvent = makeCreateNewEvent({
        clock: new RealClock(),
        uuidGenerator: new UuidV4Generator(),
      });
      const eventEmailSentToImmersion1 = createNewEvent({
        topic: "EmailWithLinkToCreateAssessmentSent",
        payload: { id: immersion1EndingThe15th.id },
      });
      await outboxRepo.save(eventEmailSentToImmersion1);

      // Act
      const queryResults =
        await immersionApplicationQueries.getAllImmersionAssessmentEmailParamsForThoseEndingThatDidntReceivedAssessmentLink(
          new Date("2022-05-15"),
        );

      // Assert
      expect(queryResults).toHaveLength(1);
      const expectedResult: ImmersionAssessmentEmailParams = {
        immersionId: immersion2EndingThe15th.id,
        mentorEmail: immersion2EndingThe15th.properties.mentorEmail,
        mentorName: immersion2EndingThe15th.properties.mentor,
        beneficiaryFirstName: immersion2EndingThe15th.properties.firstName,
        beneficiaryLastName: immersion2EndingThe15th.properties.lastName,
      };
      expect(queryResults[0]).toEqual(expectedResult);
    });
  });
});
