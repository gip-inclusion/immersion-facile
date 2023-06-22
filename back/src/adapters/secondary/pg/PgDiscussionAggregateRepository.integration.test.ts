import { Pool, PoolClient } from "pg";
import { AppellationAndRomeDto } from "shared";
import { expectToEqual } from "shared";
import { createDiscussionAggregate } from "../../../_testBuilders/DiscussionAggregateBuilder";
import { EstablishmentAggregateBuilder } from "../../../_testBuilders/EstablishmentAggregateBuilder";
import { getTestPgPool } from "../../../_testBuilders/getTestPgPool";
import { ImmersionOfferEntityV2Builder } from "../../../_testBuilders/ImmersionOfferEntityV2Builder";
import { PgDiscussionAggregateRepository } from "./PgDiscussionAggregateRepository";
import { PgEstablishmentAggregateRepository } from "./PgEstablishmentAggregateRepository";

const styliste: AppellationAndRomeDto = {
  romeCode: "B1805",
  romeLabel: "Stylisme",
  appellationCode: "19540",
  appellationLabel: "Styliste",
};

const offer = new ImmersionOfferEntityV2Builder()
  .withRomeCode(styliste.romeCode)
  .withAppellationCode(styliste.appellationCode)
  .withAppellationLabel(styliste.appellationLabel)
  .build();

describe("PgDiscussionAggregateRepository", () => {
  let pool: Pool;
  let client: PoolClient;
  let pgDiscussionAggregateRepository: PgDiscussionAggregateRepository;

  beforeAll(async () => {
    pool = getTestPgPool();
    client = await pool.connect();
  });

  beforeEach(async () => {
    await client.query("DELETE FROM immersion_offers");
    await client.query("DELETE FROM immersion_contacts");
    await client.query("DELETE FROM discussions");
    await client.query("DELETE FROM establishments");
    pgDiscussionAggregateRepository = new PgDiscussionAggregateRepository(
      client,
    );
  });

  afterAll(async () => {
    client.release();
    await pool.end();
  });

  it("Methode insertDiscussionAggregate", async () => {
    // Prepare
    const siret = "01234567891011";
    const immersionObjective = "Confirmer un projet professionnel";
    const potentialBeneficiaryResumeLink = "http://fakelink.com";
    const potentialBeneficiaryPhone = "0654678976";
    const establishmentAggregateRepo = new PgEstablishmentAggregateRepository(
      client,
    );
    await establishmentAggregateRepo.insertEstablishmentAggregates([
      new EstablishmentAggregateBuilder()
        .withEstablishmentSiret(siret)
        .withContactId("12345678-1111-2222-3333-444444444444")
        .withImmersionOffers([offer])
        .build(),
    ]);

    // Act
    const createdAt = new Date("2022-01-01T11:00:00.000Z");
    const discussionAggregate = createDiscussionAggregate({
      id: "9f6dad2c-6f02-11ec-90d6-0242ac120003",
      siret,
      immersionObjective,
      potentialBeneficiaryPhone,
      potentialBeneficiaryResumeLink,
      establishmentContact: {
        copyEmails: ["yolo@mail.com"],
      },
      appellationCode: styliste.appellationCode,
      createdAt,
    });

    await pgDiscussionAggregateRepository.insertDiscussionAggregate(
      discussionAggregate,
    );
    const retrievedDiscussionAggregate =
      await pgDiscussionAggregateRepository.retrieveDiscussionAggregate(
        discussionAggregate.id,
      );
    expectToEqual(retrievedDiscussionAggregate, discussionAggregate);
  });

  it("Methode getDiscussionsBySiretSince", async () => {
    const siret = "11112222333344";
    const since = new Date("2023-03-05");
    const immersionObjective = null;
    const potentialBeneficiaryResumeLink = "";
    const potentialBeneficiaryPhone = "";

    const establishmentAggregateRepo = new PgEstablishmentAggregateRepository(
      client,
    );
    await establishmentAggregateRepo.insertEstablishmentAggregates([
      new EstablishmentAggregateBuilder()
        .withEstablishmentSiret(siret)
        .withContactId("12345678-1111-2222-3333-444444444444")
        .withImmersionOffers([offer])
        .build(),
    ]);

    const discussionAggregate1 = createDiscussionAggregate({
      id: "bbbbbd2c-6f02-11ec-90d6-0242ac120003",
      siret,
      immersionObjective,
      potentialBeneficiaryPhone,
      potentialBeneficiaryResumeLink,
      appellationCode: styliste.appellationCode,
      createdAt: new Date("2023-03-05"),
    });

    const discussionAggregate2 = createDiscussionAggregate({
      id: "cccccd2c-6f02-11ec-90d6-0242ac120003",
      siret,
      immersionObjective,
      potentialBeneficiaryPhone,
      potentialBeneficiaryResumeLink,
      appellationCode: styliste.appellationCode,
      createdAt: new Date("2023-03-07"),
    });

    const discussionAggregateToOld = createDiscussionAggregate({
      id: "aaaaad2c-6f02-11ec-90d6-0242ac120003",
      siret,
      immersionObjective,
      potentialBeneficiaryPhone,
      potentialBeneficiaryResumeLink,
      appellationCode: styliste.appellationCode,
      createdAt: new Date("2023-03-04"),
    });

    await Promise.all([
      pgDiscussionAggregateRepository.insertDiscussionAggregate(
        discussionAggregate1,
      ),
      pgDiscussionAggregateRepository.insertDiscussionAggregate(
        discussionAggregate2,
      ),
      pgDiscussionAggregateRepository.insertDiscussionAggregate(
        discussionAggregateToOld,
      ),
    ]);

    const numberOfDiscussions =
      await pgDiscussionAggregateRepository.countDiscussionsForSiretSince(
        siret,
        since,
      );
    expect(numberOfDiscussions).toBe(2);
  });
});
