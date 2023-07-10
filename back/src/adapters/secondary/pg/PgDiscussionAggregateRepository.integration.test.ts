import { addDays } from "date-fns";
import { Pool, PoolClient } from "pg";
import { AppellationAndRomeDto, expectToEqual } from "shared";
import { DiscussionAggregateBuilder } from "../../../_testBuilders/DiscussionAggregateBuilder";
import { EstablishmentAggregateBuilder } from "../../../_testBuilders/establishmentAggregate.test.helpers";
import { getTestPgPool } from "../../../_testBuilders/getTestPgPool";
import { ImmersionOfferEntityV2Builder } from "../../../_testBuilders/ImmersionOfferEntityV2Builder";
import { DiscussionAggregate } from "../../../domain/immersionOffer/entities/DiscussionAggregate";
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

const siret = "01234567891011";

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
    await client.query("DELETE FROM immersion_contacts");
    await client.query("DELETE FROM establishments");
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

  const discussionCreatedAt = new Date("2023-07-07");

  it.each([
    {
      discussionAggregate: new DiscussionAggregateBuilder()
        .withSiret(siret)
        .withCreatedAt(discussionCreatedAt)
        .build(),
      testName: "discussion with exchange",
    },
    {
      discussionAggregate: new DiscussionAggregateBuilder()
        .withSiret(siret)
        .withExchanges([])
        .withCreatedAt(discussionCreatedAt)
        .build(),
      testName: "discussion without exchange",
    },
  ])(
    "Methode insert, update, getById and hasDiscussionMatching $testName",
    async ({ discussionAggregate }) => {
      expectToEqual(
        await pgDiscussionAggregateRepository.getById(discussionAggregate.id),
        undefined,
      );

      await pgDiscussionAggregateRepository.insert(discussionAggregate);
      expectToEqual(
        await pgDiscussionAggregateRepository.getById(discussionAggregate.id),
        discussionAggregate,
      );

      const updatedDiscussionAggregate1: DiscussionAggregate =
        new DiscussionAggregateBuilder(discussionAggregate)
          .withImmersionObjective("Initier une démarche de recrutement")
          .build();

      await pgDiscussionAggregateRepository.update(updatedDiscussionAggregate1);
      expectToEqual(
        await pgDiscussionAggregateRepository.getById(discussionAggregate.id),
        updatedDiscussionAggregate1,
      );

      const updatedDiscussionAggregate2 = new DiscussionAggregateBuilder(
        updatedDiscussionAggregate1,
      )
        .withExchanges([
          ...updatedDiscussionAggregate1.exchanges,
          {
            subject: "mon nouveau sujet",
            message: "mon nouveau message",
            recipient: "potentialBeneficiary",
            sentAt: new Date(),
            sender: "establishment",
          },
        ])
        .build();

      await pgDiscussionAggregateRepository.update(updatedDiscussionAggregate2);
      expectToEqual(
        await pgDiscussionAggregateRepository.getById(discussionAggregate.id),
        updatedDiscussionAggregate2,
      );

      expect(
        await pgDiscussionAggregateRepository.hasDiscussionMatching({
          siret: discussionAggregate.siret,
          appellationCode: discussionAggregate.appellationCode,
          potentialBeneficiaryEmail:
            discussionAggregate.potentialBeneficiary.email,
          since: discussionCreatedAt,
        }),
      ).toBe(true);

      expect(
        await pgDiscussionAggregateRepository.hasDiscussionMatching({
          siret: discussionAggregate.siret,
          appellationCode: discussionAggregate.appellationCode,
          potentialBeneficiaryEmail:
            discussionAggregate.potentialBeneficiary.email,
          since: addDays(discussionCreatedAt, 1),
        }),
      ).toBe(false);
    },
  );

  it("Method countDiscussionsForSiretSince", async () => {
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
