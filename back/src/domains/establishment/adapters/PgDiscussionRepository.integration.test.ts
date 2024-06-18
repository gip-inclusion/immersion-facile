import { addDays } from "date-fns";
import { Pool } from "pg";
import {
  AppellationAndRomeDto,
  DiscussionBuilder,
  DiscussionDto,
  WithAcquisition,
  expectPromiseToFailWithError,
  expectToEqual,
} from "shared";
import { KyselyDb, makeKyselyDb } from "../../../config/pg/kysely/kyselyUtils";
import { getTestPgPool } from "../../../config/pg/pgUtils";
import {
  EstablishmentAggregateBuilder,
  OfferEntityBuilder,
} from "../helpers/EstablishmentBuilders";
import {
  GetDiscussionsParams,
  HasDiscussionMatchingParams,
} from "../ports/DiscussionRepository";
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
    .withConventionId("some-convention-id")
    .build();

  it.each([
    {
      discussion: discussionWithExchanges,
      hasDiscussionMatchingParams: {
        siret: discussionWithExchanges.siret,
        appellationCode: discussionWithExchanges.appellationCode,
        potentialBeneficiaryEmail:
          discussionWithExchanges.potentialBeneficiary.email,
        since: discussionCreatedAt,
      },
      hasDiscussionMatchingResult: true,
      testName: "discussion with exchange",
      getDiscussionsParams: {
        sirets: [discussionWithExchanges.siret],
      },
      getDiscussionsResults: [discussionWithExchanges],
    },
    {
      discussion: discussionWithExchanges,
      hasDiscussionMatchingParams: {
        siret: discussionWithExchanges.siret,
        appellationCode: discussionWithExchanges.appellationCode,
        potentialBeneficiaryEmail:
          discussionWithExchanges.potentialBeneficiary.email,
        since: addDays(discussionCreatedAt, 1),
      },
      hasDiscussionMatchingResult: false,
      testName: "discussion with exchange with match since creation date +1",
      getDiscussionsParams: {
        sirets: [discussionWithExchanges.siret],
        createdSince: new Date(discussionWithExchanges.createdAt),
      },
      getDiscussionsResults: [discussionWithExchanges],
    },
    {
      discussion: discussionWithoutExchanges,
      hasDiscussionMatchingParams: {
        siret: discussionWithExchanges.siret,
        appellationCode: discussionWithExchanges.appellationCode,
        potentialBeneficiaryEmail:
          discussionWithExchanges.potentialBeneficiary.email,
        since: discussionCreatedAt,
      },
      hasDiscussionMatchingResult: true,
      testName: "discussion without exchange initialy",
      getDiscussionsParams: {
        sirets: [],
      },
      getDiscussionsResults: [],
    },
    {
      discussion: discussionWithoutExchanges,
      hasDiscussionMatchingParams: {
        siret: discussionWithExchanges.siret,
        appellationCode: discussionWithExchanges.appellationCode,
        potentialBeneficiaryEmail:
          discussionWithExchanges.potentialBeneficiary.email,
        since: addDays(discussionCreatedAt, 1),
      },
      hasDiscussionMatchingResult: false,
      testName:
        "discussion without exchange initialy with match since creation date +1",
      getDiscussionsParams: {
        sirets: [],
      },
      getDiscussionsResults: [],
    },
    {
      discussion: discussionWithExchanges,
      hasDiscussionMatchingParams: {
        siret: discussionWithExchanges.siret,
      },
      hasDiscussionMatchingResult: true,
      testName: "match with Siret",
      getDiscussionsParams: { sirets: [] },
      getDiscussionsResults: [],
    },
    {
      discussion: discussionWithExchanges,
      hasDiscussionMatchingParams: {
        siret: "00000000000000",
      },
      hasDiscussionMatchingResult: false,
      testName: "don't match with Siret",
      getDiscussionsParams: { sirets: [] },
      getDiscussionsResults: [],
    },
    {
      discussion: discussionWithExchanges,
      hasDiscussionMatchingParams: {
        appellationCode: discussionWithExchanges.appellationCode,
      },
      hasDiscussionMatchingResult: true,
      testName: "match with appellationCode",
      getDiscussionsParams: { sirets: [] },
      getDiscussionsResults: [],
    },
    {
      discussion: discussionWithExchanges,
      hasDiscussionMatchingParams: {
        potentialBeneficiaryEmail:
          discussionWithExchanges.potentialBeneficiary.email,
      },
      hasDiscussionMatchingResult: true,
      testName: "match with potentialBeneficiaryEmail",
      getDiscussionsParams: { sirets: [] },
      getDiscussionsResults: [],
    },
    {
      discussion: discussionWithExchanges,
      hasDiscussionMatchingParams: {
        since: discussionCreatedAt,
      },
      hasDiscussionMatchingResult: true,
      testName: "match with since",
      getDiscussionsParams: { sirets: [] },
      getDiscussionsResults: [],
    },
    {
      discussion: discussionWithExchanges,
      hasDiscussionMatchingParams: {
        establishmentRepresentativeEmail:
          discussionWithExchanges.establishmentContact.email.toUpperCase(),
      },
      hasDiscussionMatchingResult: true,
      testName: "match with establishmentRepresentativeEmail",
      getDiscussionsParams: { sirets: [] },
      getDiscussionsResults: [],
    },
  ] satisfies {
    discussion: DiscussionDto;
    hasDiscussionMatchingParams: Partial<HasDiscussionMatchingParams>;
    hasDiscussionMatchingResult: boolean;
    getDiscussionsParams: GetDiscussionsParams;
    getDiscussionsResults: DiscussionDto[] | Error;
    testName: string;
  }[])(
    "Methode insert, update, getById and hasDiscussionMatching $testName",
    async ({
      discussion,
      hasDiscussionMatchingParams,
      hasDiscussionMatchingResult,
      getDiscussionsParams,
      getDiscussionsResults,
    }) => {
      expectToEqual(
        await pgDiscussionRepository.getById(discussion.id),
        undefined,
      );

      await pgDiscussionRepository.insert(discussion);
      expectToEqual(
        await pgDiscussionRepository.getById(discussion.id),
        discussion,
      );

      getDiscussionsResults instanceof Error
        ? expectPromiseToFailWithError(
            pgDiscussionRepository.getDiscussions(getDiscussionsParams),
            getDiscussionsResults,
          )
        : expectToEqual(
            await pgDiscussionRepository.getDiscussions(getDiscussionsParams),
            getDiscussionsResults,
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

      expectToEqual(
        await pgDiscussionRepository.hasDiscussionMatching(
          hasDiscussionMatchingParams,
        ),
        hasDiscussionMatchingResult,
      );
    },
  );

  it("Method insert with acquisitionCampaign and acquisitionKeyword", async () => {
    const acquisitionParams = {
      acquisitionCampaign: "campagne",
      acquisitionKeyword: "mot-clé",
    } satisfies WithAcquisition;
    const siret = "01234567891011";
    const discussion = new DiscussionBuilder()
      .withSiret(siret)
      .withCreatedAt(new Date("2023-07-07"))
      .withAcquisition(acquisitionParams)
      .build();

    await pgDiscussionRepository.insert(discussion);

    expectToEqual(
      await db
        .selectFrom("discussions")
        .select(["acquisition_campaign", "acquisition_keyword"])
        .executeTakeFirst(),
      {
        acquisition_campaign: acquisitionParams.acquisitionCampaign,
        acquisition_keyword: acquisitionParams.acquisitionKeyword,
      },
    );
  });

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
