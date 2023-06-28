import { Pool, PoolClient } from "pg";
import { AppellationAndRomeDto, expectToEqual } from "shared";
import { DiscussionAggregateBuilder } from "../../../_testBuilders/DiscussionAggregateBuilder";
import { getTestPgPool } from "../../../_testBuilders/getTestPgPool";
import {ImmersionOfferEntityV2Builder} from "../../../_testBuilders/ImmersionOfferEntityV2Builder";
import { DiscussionAggregate } from "../../../domain/immersionOffer/entities/DiscussionAggregate";
import { PgDiscussionAggregateRepository } from "./PgDiscussionAggregateRepository";
import { EstablishmentAggregateBuilder } from "../../../_testBuilders/EstablishmentAggregateBuilder";
import {PgEstablishmentAggregateRepository} from "./PgEstablishmentAggregateRepository";

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
    await client.query("DELETE FROM discussions");
    await client.query("DELETE FROM exchanges");
    pgDiscussionAggregateRepository = new PgDiscussionAggregateRepository(
      client,
    );
    establishmentAggregateRepo = new PgEstablishmentAggregateRepository(client);
  });

  afterAll(async () => {
    client.release();
    await pool.end();
  });

  it("Methode insert and update", async () => {
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

    expectToEqual(
      await pgDiscussionAggregateRepository.getById(discussionAggregate.id),
      discussionAggregate,
    );

    const updatedDiscussionAggregate: DiscussionAggregate = {
      ...discussionAggregate,
      immersionObjective: "Initier une démarche de recrutement",
      exchanges: [
        ...discussionAggregate.exchanges,
        {
          message: "mon nouveau message",
          recipient: "potentialBeneficiary",
          sentAt: new Date(),
          sender: "establishment",
        },
      ],
    };
    await pgDiscussionAggregateRepository.update(updatedDiscussionAggregate);
    expectToEqual(
      await pgDiscussionAggregateRepository.getById(discussionAggregate.id),
      updatedDiscussionAggregate,
    );
  });

  it("Methode getById", async () => {
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
