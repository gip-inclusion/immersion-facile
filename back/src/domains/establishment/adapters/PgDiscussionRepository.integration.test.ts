import { addDays } from "date-fns";
import { Pool } from "pg";
import {
  AppellationAndRomeDto,
  DiscussionBuilder,
  DiscussionDto,
  expectToEqual,
} from "shared";
import { KyselyDb, makeKyselyDb } from "../../../config/pg/kysely/kyselyUtils";
import { getTestPgPool } from "../../../config/pg/pgUtils";
import {
  EstablishmentAggregateBuilder,
  OfferEntityBuilder,
} from "../helpers/EstablishmentBuilders";
import { HasDiscussionMatchingParams } from "../ports/DiscussionRepository";
import { PgDiscussionRepository } from "./PgDiscussionRepository";
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

describe("PgDiscussionRepository", () => {
  let pool: Pool;
  let pgDiscussionRepository: PgDiscussionRepository;
  let establishmentAggregateRepo: PgEstablishmentAggregateRepository;
  let db: KyselyDb;

  beforeAll(async () => {
    pool = getTestPgPool();
  });

  beforeEach(async () => {
    db = makeKyselyDb(pool);
    await db.deleteFrom("establishments_contacts").execute();
    await db.deleteFrom("establishments").execute();
    await db.deleteFrom("discussions").execute();
    await db.deleteFrom("exchanges").execute();
    pgDiscussionRepository = new PgDiscussionRepository(db);
    establishmentAggregateRepo = new PgEstablishmentAggregateRepository(db);
  });

  afterAll(async () => {
    await pool.end();
  });

  const discussionCreatedAt = new Date("2023-07-07");

  const discussionWithExchanges = new DiscussionBuilder()
    .withSiret(siret)
    .withEstablishmentContact({
      email: "TEST@email.com",
    })
    .withCreatedAt(discussionCreatedAt)
    .build();
  const discussionWithoutExchanges = new DiscussionBuilder()
    .withSiret(siret)
    .withExchanges([])
    .withCreatedAt(discussionCreatedAt)
    .build();

  it.each([
    {
      discussion: discussionWithExchanges,
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
      discussion: discussionWithExchanges,
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
      discussion: discussionWithoutExchanges,
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
      discussion: discussionWithoutExchanges,
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
      discussion: discussionWithExchanges,
      testFilters: {
        siret: discussionWithExchanges.siret,
      },
      expectedResult: true,
      testName: "match with Siret",
    },
    {
      discussion: discussionWithExchanges,
      testFilters: {
        siret: "00000000000000",
      },
      expectedResult: false,
      testName: "don't match with Siret",
    },
    {
      discussion: discussionWithExchanges,
      testFilters: {
        appellationCode: discussionWithExchanges.appellationCode,
      },
      expectedResult: true,
      testName: "match with appellationCode",
    },
    {
      discussion: discussionWithExchanges,
      testFilters: {
        potentialBeneficiaryEmail:
          discussionWithExchanges.potentialBeneficiary.email,
      },
      expectedResult: true,
      testName: "match with potentialBeneficiaryEmail",
    },
    {
      discussion: discussionWithExchanges,
      testFilters: {
        since: discussionCreatedAt,
      },
      expectedResult: true,
      testName: "match with since",
    },
    {
      discussion: discussionWithExchanges,
      testFilters: {
        establishmentRepresentativeEmail:
          discussionWithExchanges.establishmentContact.email.toUpperCase(),
      },
      expectedResult: true,
      testName: "match with establishmentRepresentativeEmail",
    },
  ] satisfies {
    discussion: DiscussionDto;
    testFilters: Partial<HasDiscussionMatchingParams>;
    expectedResult: boolean;
    testName: string;
  }[])(
    "Methode insert, update, getById and hasDiscussionMatching $testName",
    async ({ discussion, testFilters, expectedResult }) => {
      expectToEqual(
        await pgDiscussionRepository.getById(discussion.id),
        undefined,
      );

      await pgDiscussionRepository.insert(discussion);
      expectToEqual(
        await pgDiscussionRepository.getById(discussion.id),
        discussion,
      );

      const updatedDiscussion1: DiscussionDto = new DiscussionBuilder(
        discussion,
      )
        .withImmersionObjective("Initier une démarche de recrutement")
        .build();

      await pgDiscussionRepository.update(updatedDiscussion1);
      expectToEqual(
        await pgDiscussionRepository.getById(discussion.id),
        updatedDiscussion1,
      );

      const updatedDiscussion2 = new DiscussionBuilder(updatedDiscussion1)
        .withExchanges([
          ...updatedDiscussion1.exchanges,
          {
            subject: "mon nouveau sujet",
            message: "mon nouveau message",
            recipient: "potentialBeneficiary",
            sentAt: new Date().toISOString(),
            sender: "establishment",
          },
        ])
        .build();

      await pgDiscussionRepository.update(updatedDiscussion2);
      expectToEqual(
        await pgDiscussionRepository.getById(discussion.id),
        updatedDiscussion2,
      );

      expect(
        await pgDiscussionRepository.hasDiscussionMatching(testFilters),
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

    const discussion1 = new DiscussionBuilder()
      .withSiret(siret)
      .withId("bbbbbd2c-6f02-11ec-90d6-0242ac120003")
      .withCreatedAt(new Date("2023-03-05"))
      .build();

    const discussion2 = new DiscussionBuilder()
      .withSiret(siret)
      .withId("cccccd2c-6f02-11ec-90d6-0242ac120003")
      .withCreatedAt(new Date("2023-03-07"))
      .build();

    const discussionToOld = new DiscussionBuilder()
      .withSiret(siret)
      .withId("aaaaad2c-6f02-11ec-90d6-0242ac120003")
      .withCreatedAt(new Date("2023-03-04"))
      .build();

    await Promise.all([
      pgDiscussionRepository.insert(discussion1),
      pgDiscussionRepository.insert(discussion2),
      pgDiscussionRepository.insert(discussionToOld),
    ]);

    const numberOfDiscussions =
      await pgDiscussionRepository.countDiscussionsForSiretSince(siret, since);
    expect(numberOfDiscussions).toBe(2);
  });

  it("Deletes messages from old discussions", async () => {
    const siret = "12212222333344";
    const since = new Date("2023-03-05");

    await establishmentAggregateRepo.insertEstablishmentAggregate(
      new EstablishmentAggregateBuilder()
        .withEstablishmentSiret(siret)
        .withContactId("12345678-1111-2222-3333-444444444455")
        .withOffers([offer])
        .build(),
    );

    const discussion1 = new DiscussionBuilder()
      .withSiret(siret)
      .withId("bcbbbd2c-6f02-11ec-90d6-0242ac120104")
      .withCreatedAt(new Date("2023-11-11"))
      .withExchanges([
        {
          subject: "mon nouveau sujet",
          message: "mon nouveau message",
          recipient: "potentialBeneficiary",
          sentAt: new Date("2023-11-11").toISOString(),
          sender: "establishment",
        },
      ])
      .build();
    const discussionOld = new DiscussionBuilder()
      .withSiret(siret)
      .withId("bcbbbd2c-6f02-11ec-90d6-0242ac120103")
      .withCreatedAt(new Date("2022-11-11"))
      .withExchanges([
        {
          subject: "mon nouveau sujet",
          message: "mon nouveau message",
          recipient: "potentialBeneficiary",
          sentAt: new Date("2022-11-11").toISOString(),
          sender: "establishment",
        },
      ])
      .build();

    await Promise.all([
      pgDiscussionRepository.insert(discussion1),
      pgDiscussionRepository.insert(discussionOld),
    ]);

    const numberOfUpdatedMessages =
      await pgDiscussionRepository.deleteOldMessages(since);

    expectToEqual(numberOfUpdatedMessages, 1);
    await expectMessageToBeDeleted(discussion1, "mon nouveau message");
    await expectMessageToBeDeleted(discussionOld, "Supprimé car trop ancien");
  });

  const expectMessageToBeDeleted = async (
    discussion: DiscussionDto,
    expectedMessage: string,
  ) => {
    expectToEqual(
      await pgDiscussionRepository.getById(discussion.id),
      new DiscussionBuilder(discussion)
        .withExchanges([
          {
            subject: "mon nouveau sujet",
            message: expectedMessage,
            recipient: "potentialBeneficiary",
            sentAt: discussion.exchanges[0].sentAt,
            sender: "establishment",
          },
        ])
        .build(),
    );
  };
});
