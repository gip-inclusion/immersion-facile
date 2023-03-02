import { Pool, PoolClient } from "pg";
import { SiretDto } from "shared";
import { DiscussionAggregate } from "../../../domain/immersionOffer/entities/DiscussionAggregate";
import { EstablishmentAggregateBuilder } from "../../../_testBuilders/EstablishmentAggregateBuilder";
import { getTestPgPool } from "../../../_testBuilders/getTestPgPool";
import { PgDiscussionAggregateRepository } from "./PgDiscussionAggregateRepository";
import { PgEstablishmentAggregateRepository } from "./PgEstablishmentAggregateRepository";

// TODO : create a DiscussionAggregateBuilder
const createDiscussionAggregate = (
  id: string,
  siret: SiretDto,
  createdAt: Date,
): DiscussionAggregate => ({
  id,
  romeCode: "M1607",
  siret,
  contactMode: "EMAIL",
  createdAt,
  potentialBeneficiaryFirstName: "Claire",
  potentialBeneficiaryLastName: "Bertrand",
  potentialBeneficiaryEmail: "claire.bertrand@email.fr",
  exchanges: [
    {
      sentAt: createdAt,
      message: "Bonjour ! J'aimerais faire une immersion.",
      recipient: "establishment",
      sender: "potentialBeneficiary",
    },
  ],
});

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
    const establishmentAggregateRepo = new PgEstablishmentAggregateRepository(
      client,
    );
    await establishmentAggregateRepo.insertEstablishmentAggregates([
      new EstablishmentAggregateBuilder()
        .withEstablishmentSiret(siret)
        .withContactId("12345678-1111-2222-3333-444444444444")
        .build(),
    ]);

    // Act
    const createdAt = new Date("2022-01-01T11:00:00.000Z");
    const discussionAggregate = createDiscussionAggregate(
      "9f6dad2c-6f02-11ec-90d6-0242ac120003",
      siret,
      createdAt,
    );

    await pgDiscussionAggregateRepository.insertDiscussionAggregate(
      discussionAggregate,
    );
    const retrievedDiscussionAggregate =
      await pgDiscussionAggregateRepository.retrieveDiscussionAggregate(
        discussionAggregate.id,
      );
    expect(retrievedDiscussionAggregate).toEqual(discussionAggregate);
  });

  it("Methode getDiscussionsBySiretSince", async () => {
    const siret = "11112222333344";
    const since = new Date("2023-03-05");

    const establishmentAggregateRepo = new PgEstablishmentAggregateRepository(
      client,
    );
    await establishmentAggregateRepo.insertEstablishmentAggregates([
      new EstablishmentAggregateBuilder()
        .withEstablishmentSiret(siret)
        .withContactId("12345678-1111-2222-3333-444444444444")
        .build(),
    ]);

    const discussionAggregate1 = createDiscussionAggregate(
      "bbbbbd2c-6f02-11ec-90d6-0242ac120003",
      siret,
      new Date("2023-03-05"),
    );

    const discussionAggregate2 = createDiscussionAggregate(
      "cccccd2c-6f02-11ec-90d6-0242ac120003",
      siret,
      new Date("2023-03-07"),
    );

    const discussionAggregateToOld = createDiscussionAggregate(
      "aaaaad2c-6f02-11ec-90d6-0242ac120003",
      siret,
      new Date("2023-03-04"),
    );

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
