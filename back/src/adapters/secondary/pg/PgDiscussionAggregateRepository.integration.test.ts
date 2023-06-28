import { Pool, PoolClient } from "pg";
import { AppellationAndRomeDto } from "shared";
import { expectToEqual } from "shared";
import { DiscussionAggregateBuilder } from "../../../_testBuilders/DiscussionAggregateBuilder";
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
  let establishmentAggregateRepo: PgEstablishmentAggregateRepository;

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
    establishmentAggregateRepo = new PgEstablishmentAggregateRepository(client);
  });

  afterAll(async () => {
    client.release();
    await pool.end();
  });

  it("Methode insertDiscussionAggregate", async () => {
    const siret = "01234567891011";

    await establishmentAggregateRepo.insertEstablishmentAggregates([
      new EstablishmentAggregateBuilder()
        .withEstablishmentSiret(siret)
        .withContactId("12345678-1111-2222-3333-444444444444")
        .withImmersionOffers([offer])
        .build(),
    ]);

    const discussionAggregate = new DiscussionAggregateBuilder()
      .withSiret(siret)
      .build();

    await pgDiscussionAggregateRepository.insert(discussionAggregate);
    const retrievedDiscussionAggregate =
      await pgDiscussionAggregateRepository.getById(discussionAggregate.id);
    expect(retrievedDiscussionAggregate).toEqual(discussionAggregate);
  });

  it("Methode getDiscussionsBySiretSince", async () => {
    const siret = "11112222333344";
    const since = new Date("2023-03-05");

    await establishmentAggregateRepo.insertEstablishmentAggregates([
      new EstablishmentAggregateBuilder()
        .withEstablishmentSiret(siret)
        .withContactId("12345678-1111-2222-3333-444444444444")
        .withImmersionOffers([offer])
        .build(),
    ]);

    const discussionAggregate1 = new DiscussionAggregateBuilder()
      .withSiret(siret)
      .withId("bbbbbd2c-6f02-11ec-90d6-0242ac120003")
      .withCreatedAt(new Date("2023-03-05"))
      .build();

    const discussionAggregate2 = new DiscussionAggregateBuilder()
      .withSiret(siret)
      .withId("cccccd2c-6f02-11ec-90d6-0242ac120003")
      .withCreatedAt(new Date("2023-03-07"))
      .build();

    const discussionAggregateToOld = new DiscussionAggregateBuilder()
      .withSiret(siret)
      .withId("aaaaad2c-6f02-11ec-90d6-0242ac120003")
      .withCreatedAt(new Date("2023-03-04"))
      .build();

    await Promise.all([
      pgDiscussionAggregateRepository.insert(discussionAggregate1),
      pgDiscussionAggregateRepository.insert(discussionAggregate2),
      pgDiscussionAggregateRepository.insert(discussionAggregateToOld),
    ]);

    const numberOfDiscussions =
      await pgDiscussionAggregateRepository.countDiscussionsForSiretSince(
        siret,
        since,
      );
    expect(numberOfDiscussions).toBe(2);
  });
});
