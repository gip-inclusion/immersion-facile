import { Pool, PoolClient } from "pg";
import {
  AgencyDtoBuilder,
  ConventionDtoBuilder,
  ConventionId,
  ConventionReadDto,
  expectTypeToMatchAndEqual,
  expectArraysToEqualIgnoringOrder,
  expectToEqual,
} from "shared";
import { makeCreateNewEvent } from "../../../domain/core/eventBus/EventBus";
import { getTestPgPool } from "../../../_testBuilders/getTestPgPool";
import { RealTimeGateway } from "../core/TimeGateway/RealTimeGateway";
import { UuidV4Generator } from "../core/UuidGeneratorImplementations";
import { PgAgencyRepository } from "./PgAgencyRepository";
import { PgConventionQueries } from "./PgConventionQueries";
import { PgConventionRepository } from "./PgConventionRepository";
import { PgOutboxRepository } from "./PgOutboxRepository";

const idA: ConventionId = "aaaaac99-9c0b-1aaa-aa6d-6bb9bd38aaaa";
const idB: ConventionId = "bbbbbc99-9c0b-1bbb-bb6d-6bb9bd38bbbb";

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
        "75",
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
        insertAgencyAndConvention(idA, idA, "agency A", "75"),
        insertAgencyAndConvention(idB, idB, "agency B", "76"),
      ]);
      // Act
      const resultAll = await conventionQueries.getLatestConventions({});

      // Assert
      expectArraysToEqualIgnoringOrder(resultAll, insertedConventionReadDtos);
    });
    it("Gets only convention of a given agency", async () => {
      // Prepare
      const insertedConventionReadDtos = await Promise.all([
        insertAgencyAndConvention(idA, idA, "agency A", "75"),
        insertAgencyAndConvention(idB, idB, "agency B", "76"),
      ]);

      // Act
      const resultAll = await conventionQueries.getLatestConventions({
        agencyId: idA,
      });

      // Assert
      expect(resultAll).toEqual([insertedConventionReadDtos[0]]);
    });
  });

  describe("PG implementation of method getAllConventionsForThoseEndingThatDidntReceivedAssessmentLink", () => {
    const agency = AgencyDtoBuilder.create().build();
    beforeEach(async () => {
      const agencyRepository = new PgAgencyRepository(client);
      await agencyRepository.insert(agency);
      await client.query("DELETE FROM outbox_failures");
      await client.query("DELETE FROM outbox_publications");
      await client.query("DELETE FROM outbox");
    });
    it("Gets all email params of validated immersions ending at given date that did not received any assessment link yet", async () => {
      // Prepare : insert an immersion ending the 14/05/2022 and two others ending the 15/05/2022 amongst which one already received an assessment link.
      const conventionRepo = new PgConventionRepository(client);
      const outboxRepo = new PgOutboxRepository(client);
      const dateStart = new Date("2022-05-10").toISOString();
      const dateEnd14 = new Date("2022-05-14").toISOString();
      const dateEnd15 = new Date("2022-05-15").toISOString();
      const validatedImmersionEndingThe14th = new ConventionDtoBuilder()
        .withId("aaaaac14-9c0a-1aaa-aa6d-6aa9ad38aaaa")
        .validated()
        .withDateStart(dateStart)
        .withDateEnd(dateEnd14)
        .build();
      const validatedImmersionEndingThe15thThatAlreadyReceivedAnEmail =
        new ConventionDtoBuilder()
          .withId("aaaaac15-9c0a-1aaa-aa6d-6aa9ad38aaaa")
          .validated()
          .withDateStart(dateStart)
          .withDateEnd(dateEnd15)
          .build();
      const validatedImmersionEndingThe15th = new ConventionDtoBuilder()
        .withId("bbbbbc15-9c0a-1aaa-aa6d-6aa9ad38aaaa")
        .validated()
        .withDateStart(dateStart)
        .withDateEnd(dateEnd15)
        .withEstablishmentTutorFirstName("Romain")
        .withEstablishmentTutorLastName("Grandjean")
        .withExternalId("3")
        .build();
      const ongoingImmersionEndingThe15th = new ConventionDtoBuilder()
        .withId("cccccc15-9c0a-1aaa-aa6d-6aa9ad38aaaa")
        .withDateStart("2022-05-10")
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
          agencyName: "empty-name",
          agencyDepartment: agency.address.departmentCode,
        },
      ]);
    });
  });

  const insertAgencyAndConvention = async (
    conventionId: ConventionId,
    agencyId: string,
    agencyName: string,
    agencyDepartment: string,
  ): Promise<ConventionReadDto> => {
    const agency = AgencyDtoBuilder.create()
      .withId(agencyId)
      .withName(agencyName)
      .withAddress({
        city: "Paris",
        departmentCode: agencyDepartment,
        postcode: "75017",
        streetNumberAndAddress: "Avenue des champs Elysées",
      })
      .build();
    const convention = new ConventionDtoBuilder()
      .withAgencyId(agencyId)
      .withId(conventionId)
      .withStatus("DRAFT")
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
      .build();

    await agencyRepo.insert(agency);
    const externalId = await conventionRepository.save(convention);
    return { ...convention, externalId, agencyName, agencyDepartment };
  };
});
