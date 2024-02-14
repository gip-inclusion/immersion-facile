import { addDays } from "date-fns";
import { Pool, PoolClient } from "pg";
import { AppellationAndRomeDto, expectToEqual } from "shared";
import { DiscussionAggregate } from "../../../../domain/offer/entities/DiscussionAggregate";
import { HasDiscussionMatchingParams } from "../../../../domain/offer/ports/DiscussionAggregateRepository";
import {
  EstablishmentAggregateBuilder,
  OfferEntityBuilder,
} from "../../offer/EstablishmentBuilders";
import { DiscussionAggregateBuilder } from "../../offer/InMemoryDiscussionAggregateRepository";
import { makeKyselyDb } from "../kysely/kyselyUtils";
import { getTestPgPool } from "../pgUtils";
import { PgDiscussionAggregateRepository } from "./PgDiscussionAggregateRepository";
import { PgEstablishmentAggregateRepository } from "./PgEstablishmentAggregateRepository";

const styliste: AppellationAndRomeDto = {
  romeCode: "B1805",
  romeLabel: "Stylisme",
  appellationCode: "19540",

  appellationLabel: "Styliste",
};

const offer = new OfferEntityBuilder()
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
    const transaction = makeKyselyDb(pool);
    pgDiscussionAggregateRepository = new PgDiscussionAggregateRepository(
      transaction,
    );
    establishmentAggregateRepo = new PgEstablishmentAggregateRepository(
      transaction,
    );
  });

  afterAll(async () => {
    client.release();
    await pool.end();
  });

  const discussionCreatedAt = new Date("2023-07-07");

  const discussionWithExchanges = new DiscussionAggregateBuilder()
    .withSiret(siret)
    .withEstablishmentContact({
      email: "TEST@email.com",
    })
    .withCreatedAt(discussionCreatedAt)
    .build();
  const discussionWithoutExchanges = new DiscussionAggregateBuilder()
    .withSiret(siret)
    .withExchanges([])
    .withCreatedAt(discussionCreatedAt)
    .build();

  it.each([
    {
      discussionAggregate: discussionWithExchanges,
      testFilters: {
        siret: discussionWithExchanges.siret,
        appellationCode: discussionWithExchanges.appellationCode,
        potentialBeneficiaryEmail:
          discussionWithExchanges.potentialBeneficiary.email,
        since: discussionCreatedAt,
      },
      expectedResult: true,
      testName: "discussion with exchange",
    },
    {
      discussionAggregate: discussionWithExchanges,
      testFilters: {
        siret: discussionWithExchanges.siret,
        appellationCode: discussionWithExchanges.appellationCode,
        potentialBeneficiaryEmail:
          discussionWithExchanges.potentialBeneficiary.email,
        since: addDays(discussionCreatedAt, 1),
      },
      expectedResult: false,
      testName: "discussion with exchange with match since creation date +1",
    },
    {
      discussionAggregate: discussionWithoutExchanges,
      testFilters: {
        siret: discussionWithExchanges.siret,
        appellationCode: discussionWithExchanges.appellationCode,
        potentialBeneficiaryEmail:
          discussionWithExchanges.potentialBeneficiary.email,
        since: discussionCreatedAt,
      },
      expectedResult: true,
      testName: "discussion without exchange initialy",
    },
    {
      discussionAggregate: discussionWithoutExchanges,
      testFilters: {
        siret: discussionWithExchanges.siret,
        appellationCode: discussionWithExchanges.appellationCode,
        potentialBeneficiaryEmail:
          discussionWithExchanges.potentialBeneficiary.email,
        since: addDays(discussionCreatedAt, 1),
      },
      expectedResult: false,
      testName:
        "discussion without exchange initialy with match since creation date +1",
    },
    {
      discussionAggregate: discussionWithExchanges,
      testFilters: {
        siret: discussionWithExchanges.siret,
      },
      expectedResult: true,
      testName: "match with Siret",
    },
    {
      discussionAggregate: discussionWithExchanges,
      testFilters: {
        siret: "00000000000000",
      },
      expectedResult: false,
      testName: "don't match with Siret",
    },
    {
      discussionAggregate: discussionWithExchanges,
      testFilters: {
        appellationCode: discussionWithExchanges.appellationCode,
      },
      expectedResult: true,
      testName: "match with appellationCode",
    },
    {
      discussionAggregate: discussionWithExchanges,
      testFilters: {
        potentialBeneficiaryEmail:
          discussionWithExchanges.potentialBeneficiary.email,
      },
      expectedResult: true,
      testName: "match with potentialBeneficiaryEmail",
    },
    {
      discussionAggregate: discussionWithExchanges,
      testFilters: {
        since: discussionCreatedAt,
      },
      expectedResult: true,
      testName: "match with since",
    },
    {
      discussionAggregate: discussionWithExchanges,
      testFilters: {
        establishmentRepresentativeEmail:
          discussionWithExchanges.establishmentContact.email.toUpperCase(),
      },
      expectedResult: true,
      testName: "match with establishmentRepresentativeEmail",
    },
  ] satisfies {
    discussionAggregate: DiscussionAggregate;
    testFilters: Partial<HasDiscussionMatchingParams>;
    expectedResult: boolean;
    testName: string;
  }[])(
    "Methode insert, update, getById and hasDiscussionMatching $testName",
    async ({ discussionAggregate, testFilters, expectedResult }) => {
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
        await pgDiscussionAggregateRepository.hasDiscussionMatching(
          testFilters,
        ),
      ).toBe(expectedResult);
    },
  );

  it("Method countDiscussionsForSiretSince", async () => {
    const siret = "11112222333344";
    const since = new Date("2023-03-05");

    await establishmentAggregateRepo.insertEstablishmentAggregate(
      new EstablishmentAggregateBuilder()
        .withEstablishmentSiret(siret)
        .withContactId("12345678-1111-2222-3333-444444444444")
        .withOffers([offer])
        .build(),
    );

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

  it("Delete messages from old discussions", async () => {
    const siret = "12212222333344";
    const since = new Date("2023-03-05");

    await establishmentAggregateRepo.insertEstablishmentAggregate(
      new EstablishmentAggregateBuilder()
        .withEstablishmentSiret(siret)
        .withContactId("12345678-1111-2222-3333-444444444455")
        .withOffers([offer])
        .build(),
    );

    const discussionAggregate1 = new DiscussionAggregateBuilder()
      .withSiret(siret)
      .withId("bcbbbd2c-6f02-11ec-90d6-0242ac120104")
      .withCreatedAt(new Date("2023-11-11"))
      .withExchanges([
        {
          subject: "mon nouveau sujet",
          message: "mon nouveau message",
          recipient: "potentialBeneficiary",
          sentAt: new Date("2023-11-11"),
          sender: "establishment",
        },
      ])
      .build();
    const discussionAggregateOld = new DiscussionAggregateBuilder()
      .withSiret(siret)
      .withId("bcbbbd2c-6f02-11ec-90d6-0242ac120103")
      .withCreatedAt(new Date("2022-11-11"))
      .withExchanges([
        {
          subject: "mon nouveau sujet",
          message: "mon nouveau message",
          recipient: "potentialBeneficiary",
          sentAt: new Date("2022-11-11"),
          sender: "establishment",
        },
      ])
      .build();

    await Promise.all([
      pgDiscussionAggregateRepository.insert(discussionAggregate1),
      pgDiscussionAggregateRepository.insert(discussionAggregateOld),
    ]);

    const numberOfUpdatedMessages =
      await pgDiscussionAggregateRepository.deleteOldMessages(since);

    expectToEqual(numberOfUpdatedMessages, 1);
    await expectMessageToBeDeleted(discussionAggregate1, "mon nouveau message");
    await expectMessageToBeDeleted(
      discussionAggregateOld,
      "Supprimé car trop ancien",
    );
  });

  const expectMessageToBeDeleted = async (
    discussion: DiscussionAggregate,
    expectedMessage: string,
  ) => {
    expectToEqual(
      await pgDiscussionAggregateRepository.getById(discussion.id),
      new DiscussionAggregateBuilder(discussion)
        .withExchanges([
          {
            subject: "mon nouveau sujet",
            message: expectedMessage,
            recipient: "potentialBeneficiary",
            sentAt: new Date(discussion.exchanges[0].sentAt),
            sender: "establishment",
          },
        ])
        .build(),
    );
  };
});
