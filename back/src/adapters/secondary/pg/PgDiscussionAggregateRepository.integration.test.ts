import { Pool, PoolClient } from "pg";
import { DiscussionAggregate } from "../../../domain/immersionOffer/entities/DiscussionAggregate";
import { EstablishmentAggregateBuilder } from "../../../_testBuilders/EstablishmentAggregateBuilder";
import { getTestPgPool } from "../../../_testBuilders/getTestPgPool";
import { PgDiscussionAggregateRepository } from "./PgDiscussionAggregateRepository";
import { PgEstablishmentAggregateRepository } from "./PgEstablishmentAggregateRepository";

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

  it("Insert discussion aggregate", async () => {
    // Prepare
    const siret = "01234567891011";
    const establishmentAggregateRepo = new PgEstablishmentAggregateRepository(
      client,
    );
    await establishmentAggregateRepo.insertEstablishmentAggregates([
      new EstablishmentAggregateBuilder().withEstablishmentSiret(siret).build(),
    ]);

    // Act
    const createdAt = new Date("2022-01-01T11:00:00.000Z");
    const discussionAggregate: DiscussionAggregate = {
      id: "9f6dad2c-6f02-11ec-90d6-0242ac120003",
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
    };
    await pgDiscussionAggregateRepository.insertDiscussionAggregate(
      discussionAggregate,
    );
    const retrievedDiscussionAggregate =
      await pgDiscussionAggregateRepository.retrieveDiscussionAggregate(
        discussionAggregate.id,
      );
    expect(retrievedDiscussionAggregate).toEqual(discussionAggregate);
  });
});
