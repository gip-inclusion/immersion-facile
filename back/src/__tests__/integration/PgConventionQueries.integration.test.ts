import { Pool, PoolClient } from "pg";
import { AgencyDtoBuilder } from "shared/src/agency/AgencyDtoBuilder";
import {
  ConventionId,
  ConventionReadDto,
} from "shared/src/convention/convention.dto";
import { ConventionDtoBuilder } from "shared/src/convention/ConventionDtoBuilder";
import { getTestPgPool } from "../../_testBuilders/getTestPgPool";
import {
  expectArraysToEqualIgnoringOrder,
  expectTypeToMatchAndEqual,
} from "../../_testBuilders/test.helpers";
import { RealClock } from "../../adapters/secondary/core/ClockImplementations";
import { UuidV4Generator } from "../../adapters/secondary/core/UuidGeneratorImplementations";
import { PgAgencyRepository } from "../../adapters/secondary/pg/PgAgencyRepository";
import { PgConventionQueries } from "../../adapters/secondary/pg/PgConventionQueries";
import { PgConventionRepository } from "../../adapters/secondary/pg/PgConventionRepository";
import { PgOutboxRepository } from "../../adapters/secondary/pg/PgOutboxRepository";
import { makeCreateNewEvent } from "../../domain/core/eventBus/EventBus";
import { ImmersionAssessmentEmailParams } from "../../domain/immersionOffer/useCases/SendEmailsWithAssessmentCreationLink";

const idA: ConventionId = "aaaaac99-9c0b-aaaa-aa6d-6bb9bd38aaaa";
const idB: ConventionId = "bbbbbc99-9c0b-bbbb-bb6d-6bb9bd38bbbb";

const beneficiarySignedDate = new Date("2021-01-04").toISOString();

describe("Pg implementation of ConventionQueries", () => {
  let pool: Pool;
  let client: PoolClient;
  let conventionQueries: PgConventionQueries;
  let agencyRepo: PgAgencyRepository;
  let conventionRepository: PgConventionRepository;

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

    conventionQueries = new PgConventionQueries(client);
    agencyRepo = new PgAgencyRepository(client);
    conventionRepository = new PgConventionRepository(client);
  });

  afterAll(async () => {
    client.release();
    await pool.end();
  });
  describe("PG implementation of method getConventionById", () => {
    it("Returns undefined if no convention with such id", async () => {
      expect(await conventionQueries.getConventionById(idA)).toBeUndefined();
    });
    it("Retrieves a convention by id exists", async () => {
      // Prepare
      const expectedConventionRead = await insertAgencyAndConvention(
        idA,
        idA,
        "agency A",
      );

      // Act
      const result = await conventionQueries.getConventionById(idA);

      // Assert
      expectTypeToMatchAndEqual(result, expectedConventionRead);
    });
  });
  describe("PG implementation of method getLatestUpdated", () => {
    it("Gets all saved conventionAdminDtos", async () => {
      // Prepare
      const insertedConventionReadDtos = await Promise.all([
        insertAgencyAndConvention(idA, idA, "agency A"),
        insertAgencyAndConvention(idB, idB, "agency B"),
      ]);
      // Act
      const resultAll = await conventionQueries.getLatestConventions({});

      // Assert
      expectArraysToEqualIgnoringOrder(resultAll, insertedConventionReadDtos);
    });
    it("Gets only convention of a given agency", async () => {
      // Prepare
      const insertedConventionReadDtos = await Promise.all([
        insertAgencyAndConvention(idA, idA, "agency A"),
        insertAgencyAndConvention(idB, idB, "agency B"),
      ]);

      // Act
      const resultAll = await conventionQueries.getLatestConventions({
        agencyId: idA,
      });

      // Assert
      expect(resultAll).toEqual([insertedConventionReadDtos[0]]);
    });
  });

  describe("PG implementation of method getAllImmersionAssessmentEmailParamsForThoseEndingThatDidntReceivedAssessmentLink", () => {
    beforeEach(async () => {
      const agencyRepository = new PgAgencyRepository(client);
      await agencyRepository.insert(AgencyDtoBuilder.create().build());
      await client.query("DELETE FROM outbox_failures");
      await client.query("DELETE FROM outbox_publications");
      await client.query("DELETE FROM outbox");
    });
    it("Gets all email params of validated immersions ending at given date that did not received any assessment link yet", async () => {
      // Prepare : insert an immersion ending the 14/05/2022 and two others ending the 15/05/2022 amongst which one already received an assessment link.
      const conventionRepo = new PgConventionRepository(client);
      const outboxRepo = new PgOutboxRepository(client);
      const validatedImmersionEndingThe14th = new ConventionDtoBuilder()
        .withId("aaaaac14-9c0a-aaaa-aa6d-6aa9ad38aaaa")
        .validated()
        .withDateEnd("2022-05-14")
        .build();
      const validatedImmersionEndingThe15thThatAlreadyReceivedAnEmail =
        new ConventionDtoBuilder()
          .withId("aaaaac15-9c0a-aaaa-aa6d-6aa9ad38aaaa")
          .validated()
          .withDateEnd("2022-05-15")
          .build();
      const validatedImmersionEndingThe15th = new ConventionDtoBuilder()
        .withId("bbbbbc15-9c0a-aaaa-aa6d-6aa9ad38aaaa")
        .validated()
        .withDateEnd("2022-05-15")
        .withMentorFirstName("Romain")
        .withMentorLastName("Grandjean")
        .build();
      const ongoingImmersionEndingThe15th = new ConventionDtoBuilder()
        .withId("cccccc15-9c0a-aaaa-aa6d-6aa9ad38aaaa")
        .withDateEnd("2022-05-15")
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
        clock: new RealClock(),
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
        await conventionQueries.getAllImmersionAssessmentEmailParamsForThoseEndingThatDidntReceivedAssessmentLink(
          new Date("2022-05-15"),
        );

      // Assert
      expect(queryResults).toHaveLength(1);
      const expectedResult: ImmersionAssessmentEmailParams = {
        immersionId: validatedImmersionEndingThe15th.id,
        mentorEmail: validatedImmersionEndingThe15th.signatories.mentor.email,
        mentorName: "Romain Grandjean",
        beneficiaryFirstName:
          validatedImmersionEndingThe15th.signatories.beneficiary.firstName,
        beneficiaryLastName:
          validatedImmersionEndingThe15th.signatories.beneficiary.lastName,
      };
      expect(queryResults[0]).toEqual(expectedResult);
    });
  });

  const insertAgencyAndConvention = async (
    conventionId: ConventionId,
    agencyId: string,
    agencyName: string,
  ): Promise<ConventionReadDto> => {
    const agency = AgencyDtoBuilder.create()
      .withId(agencyId)
      .withName(agencyName)
      .build();
    const convention = new ConventionDtoBuilder()
      .withAgencyId(agencyId)
      .withId(conventionId)
      .notSigned()
      .signedByBeneficiary(beneficiarySignedDate)
      .build();

    await agencyRepo.insert(agency);
    const externalId = await conventionRepository.save(convention);
    return { ...convention, externalId, agencyName };
  };
});
