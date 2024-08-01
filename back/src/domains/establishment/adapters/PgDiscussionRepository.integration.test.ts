import { addDays, subDays } from "date-fns";
import { Pool } from "pg";
import {
  AppellationAndRomeDto,
  DiscussionBuilder,
  DiscussionDto,
  Exchange,
  WithAcquisition,
  errors,
  expectPromiseToFailWithError,
  expectToEqual,
} from "shared";
import { v4 as uuid } from "uuid";
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

const date = new Date("2023-07-07");

const discussionWithLastExchangeByPotentialBeneficiary1 =
  new DiscussionBuilder()
    .withId(uuid())
    .withSiret("00000000000001")
    .withEstablishmentContact({
      email: "test@email.com",
    })
    .withExchanges([
      {
        message: "",
        sender: "potentialBeneficiary",
        recipient: "establishment",
        sentAt: date.toISOString(),
        subject: "exchange with potentialBeneficiary 1",
        attachments: [
          {
            link: "magicTokenBrevo",
            name: "monPdf.pdf",
          },
        ],
      },
    ])
    .withCreatedAt(date)
    .build();
const discussionRejectedWithLastExchangeByPotentialBeneficiary =
  new DiscussionBuilder(discussionWithLastExchangeByPotentialBeneficiary1)
    .withId(uuid())
    .withSiret("00000000000010")
    .withStatus("REJECTED")
    .build();
const discussionAcceptedWithLastExchangeByPotentialBeneficiary =
  new DiscussionBuilder(discussionWithLastExchangeByPotentialBeneficiary1)
    .withId(uuid())
    .withSiret("00000000000011")
    .withStatus("ACCEPTED")
    .build();
const discussionWithLastExchangeByEstablishment2 = new DiscussionBuilder()
  .withId(uuid())
  .withSiret("00000000000003")
  .withExchanges([
    {
      message: "",
      recipient: "potentialBeneficiary",
      sender: "establishment",
      sentAt: date.toISOString(),
      subject: "exchange with establishment 2",
      attachments: [],
    },
  ])
  .withCreatedAt(addDays(date, -1))
  .build();
const discussionWithoutExchanges3 = new DiscussionBuilder()
  .withId(uuid())
  .withSiret("00000000000002")
  .withExchanges([])
  .withConventionId("some-convention-id")
  .withCreatedAt(addDays(date, -2))
  .build();

const discussionWithRejectedStatusAndReason4 = new DiscussionBuilder()
  .withId(uuid())
  .withSiret("00000000000004")
  .withExchanges([])
  .withConventionId("some-other-convention-id")
  .withStatus("REJECTED", "OTHER", "my custom reason")
  .withCreatedAt(addDays(date, -3))
  .build();

const discussionWithAcceptedStatus5 = new DiscussionBuilder()
  .withId(uuid())
  .withSiret("00000000000005")
  .withExchanges([])
  .withConventionId("another-convention-id")
  .withStatus("ACCEPTED")
  .withCreatedAt(addDays(date, -4))
  .build();

const discussionWithPotentialBeneficiaryInformations6 = new DiscussionBuilder()
  .withPotentialBeneficiary({
    datePreferences: "my fake date preferences",
    email: "fake-address@mail.com",
    firstName: "John",
    lastName: "Doe",
    hasWorkingExperience: true,
    experienceAdditionalInformation: "my fake experience",
    phone: "0549000000",
    resumeLink: "https://www.my-link.com",
  })
  .withCreatedAt(addDays(date, -5))
  .build();

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

  describe("getDiscussions", () => {
    //TODO getDiscussions with lastAnsweredByCandidate parameter
    beforeEach(async () => {
      await Promise.all(
        [
          discussionWithLastExchangeByPotentialBeneficiary1,
          discussionWithLastExchangeByEstablishment2,
          discussionWithoutExchanges3,
          discussionWithRejectedStatusAndReason4,
          discussionWithAcceptedStatus5,
          discussionWithPotentialBeneficiaryInformations6,
          discussionRejectedWithLastExchangeByPotentialBeneficiary,
          discussionAcceptedWithLastExchangeByPotentialBeneficiary,
        ].map((discussion) => pgDiscussionRepository.insert(discussion)),
      );
    });
    describe("unit filter param", () => {
      it("siret filter param", async () => {
        expectToEqual(
          await pgDiscussionRepository.getDiscussions({
            filters: {
              sirets: [discussionWithLastExchangeByPotentialBeneficiary1.siret],
            },
            limit: 5,
          }),
          [discussionWithLastExchangeByPotentialBeneficiary1],
        );
      });
      it("createdSince filter param", async () => {
        expectToEqual(
          await pgDiscussionRepository.getDiscussions({
            filters: {
              createdSince: addDays(date, -4),
            },
            limit: 10,
          }),
          [
            discussionWithLastExchangeByPotentialBeneficiary1,
            discussionRejectedWithLastExchangeByPotentialBeneficiary,
            discussionAcceptedWithLastExchangeByPotentialBeneficiary,
            discussionWithLastExchangeByEstablishment2,
            discussionWithoutExchanges3,
            discussionWithRejectedStatusAndReason4,
            discussionWithAcceptedStatus5,
          ],
        );
      });

      describe("lastAnsweredByCandidate filter param", () => {
        it("simple scenario", async () => {
          expectToEqual(
            await pgDiscussionRepository.getDiscussions({
              filters: {
                status: "PENDING",
                lastAnsweredByCandidate: {
                  from: addDays(date, -1),
                  to: date,
                },
              },
              limit: 5,
            }),
            [discussionWithLastExchangeByPotentialBeneficiary1],
          );
        });

        it("filters discussions even if they have a lot of exchanges", async () => {
          const now = new Date("2024-08-01");
          const discussionWithLotOfExchanges = new DiscussionBuilder()
            .withId(uuid())
            .withExchanges(
              (
                [
                  {
                    sender: "potentialBeneficiary",
                    recipient: "establishment",
                    sentAt: new Date("2024-07-20 19:45:34").toISOString(),
                  },
                  {
                    sender: "establishment",
                    recipient: "potentialBeneficiary",
                    sentAt: new Date("2024-07-22 08:02:54").toISOString(),
                  },
                  {
                    sender: "potentialBeneficiary",
                    recipient: "establishment",
                    sentAt: new Date("2024-07-22 12:35:16").toISOString(),
                  },
                  {
                    sender: "potentialBeneficiary",
                    recipient: "establishment",
                    sentAt: new Date("2024-07-23 18:48:35").toISOString(),
                  },
                  {
                    sender: "establishment",
                    recipient: "potentialBeneficiary",
                    sentAt: new Date("2024-07-24 07:17:59").toISOString(),
                  },
                  {
                    sender: "establishment",
                    recipient: "potentialBeneficiary",
                    sentAt: new Date("2024-07-24 08:39:28").toISOString(),
                  },
                  {
                    sender: "potentialBeneficiary",
                    recipient: "establishment",
                    sentAt: new Date("2024-07-25 12:04:29").toISOString(),
                  },
                  {
                    sender: "potentialBeneficiary",
                    recipient: "establishment",
                    sentAt: new Date("2024-07-25 12:12:20").toISOString(),
                  },
                  {
                    sender: "potentialBeneficiary",
                    recipient: "establishment",
                    sentAt: new Date("2024-07-25 17:49:05").toISOString(),
                  },
                  {
                    sender: "potentialBeneficiary",
                    recipient: "establishment",
                    sentAt: new Date("2024-07-29 08:03:20").toISOString(),
                  },
                  {
                    sender: "establishment",
                    recipient: "potentialBeneficiary",
                    sentAt: new Date("2024-07-29 08:47:52").toISOString(),
                  },
                ] satisfies Pick<Exchange, "sender" | "recipient" | "sentAt">[]
              ).map((rest) => ({
                ...rest,
                message: "",
                subject: "",
                attachments: [],
              })),
            )
            .build();

          await pgDiscussionRepository.insert(discussionWithLotOfExchanges);

          expectToEqual(
            await pgDiscussionRepository.getDiscussions({
              filters: {
                lastAnsweredByCandidate: {
                  from: subDays(now, 4),
                  to: subDays(now, 3),
                },
              },
              limit: 5,
            }),
            [],
          );
          expectToEqual(
            await pgDiscussionRepository.getDiscussions({
              filters: {
                lastAnsweredByCandidate: {
                  from: subDays(now, 8),
                  to: subDays(now, 7),
                },
              },
              limit: 5,
            }),
            [],
          );
        });
      });
    });
    describe("combo filters", () => {
      it("no result if siret excluded from filter", async () => {
        expectToEqual(
          await pgDiscussionRepository.getDiscussions({
            filters: {
              status: "PENDING",
              lastAnsweredByCandidate: {
                from: addDays(date, -1),
                to: date,
              },
            },
            limit: 5,
          }),
          [discussionWithLastExchangeByPotentialBeneficiary1],
        );
        expectToEqual(
          await pgDiscussionRepository.getDiscussions({
            filters: {
              sirets: [discussionWithoutExchanges3.siret],
              lastAnsweredByCandidate: {
                from: addDays(date, -1),
                to: date,
              },
            },
            limit: 5,
          }),
          [],
        );
      });
    });
  });

  describe("hasDiscussionMatching", () => {
    it.each([
      {
        discussionInRepo: discussionWithLastExchangeByPotentialBeneficiary1,
        params: {
          siret: discussionWithLastExchangeByPotentialBeneficiary1.siret,
        },
        result: true,
      },
      {
        discussionInRepo: discussionWithLastExchangeByPotentialBeneficiary1,
        params: {
          siret: discussionWithoutExchanges3.siret,
        },
        result: false,
      },
      {
        discussionInRepo: discussionWithLastExchangeByPotentialBeneficiary1,
        params: {
          appellationCode:
            discussionWithLastExchangeByPotentialBeneficiary1.appellationCode,
        },
        result: true,
      },
      {
        discussionInRepo: discussionWithLastExchangeByPotentialBeneficiary1,
        params: {
          potentialBeneficiaryEmail:
            discussionWithLastExchangeByPotentialBeneficiary1
              .potentialBeneficiary.email,
        },
        result: true,
      },
      {
        discussionInRepo: discussionWithLastExchangeByPotentialBeneficiary1,
        params: {
          since: new Date(
            discussionWithLastExchangeByPotentialBeneficiary1.createdAt,
          ),
        },
        result: true,
      },
      {
        discussionInRepo: discussionWithLastExchangeByPotentialBeneficiary1,
        params: {
          establishmentRepresentativeEmail:
            discussionWithLastExchangeByPotentialBeneficiary1
              .establishmentContact.email,
        },
        result: true,
      },
      {
        discussionInRepo: discussionWithLastExchangeByPotentialBeneficiary1,
        params: {
          siret: discussionWithLastExchangeByPotentialBeneficiary1.siret,
          appellationCode:
            discussionWithLastExchangeByPotentialBeneficiary1.appellationCode,
          potentialBeneficiaryEmail:
            discussionWithLastExchangeByPotentialBeneficiary1
              .potentialBeneficiary.email,
          since: date,
        },
        result: true,
      },
      {
        discussionInRepo: discussionWithLastExchangeByPotentialBeneficiary1,
        params: {
          siret: discussionWithLastExchangeByPotentialBeneficiary1.siret,
          appellationCode:
            discussionWithLastExchangeByPotentialBeneficiary1.appellationCode,
          potentialBeneficiaryEmail:
            discussionWithLastExchangeByPotentialBeneficiary1
              .potentialBeneficiary.email,
          since: addDays(date, 1),
        },
        result: false,
      },
      {
        discussionInRepo: discussionWithoutExchanges3,
        params: {
          siret: discussionWithoutExchanges3.siret,
          appellationCode: discussionWithoutExchanges3.appellationCode,
          potentialBeneficiaryEmail:
            discussionWithoutExchanges3.potentialBeneficiary.email,
          since: new Date(discussionWithoutExchanges3.createdAt),
        },
        result: true,
      },
      {
        discussionInRepo: discussionWithoutExchanges3,
        params: {
          siret: discussionWithLastExchangeByPotentialBeneficiary1.siret,
          appellationCode:
            discussionWithLastExchangeByPotentialBeneficiary1.appellationCode,
          potentialBeneficiaryEmail:
            discussionWithLastExchangeByPotentialBeneficiary1
              .potentialBeneficiary.email,
          since: addDays(new Date(discussionWithoutExchanges3.createdAt), 1),
        },
        result: false,
      },
    ] satisfies {
      discussionInRepo: DiscussionDto;
      params: Partial<HasDiscussionMatchingParams>;
      result: boolean;
    }[])(
      `hasDiscussionMatching '$result'
          with params: '$params'`,
      async ({ discussionInRepo, params, result }) => {
        await pgDiscussionRepository.insert(discussionInRepo);

        expectToEqual(
          await pgDiscussionRepository.hasDiscussionMatching(params),
          result,
        );
      },
    );

    it("throws when no params provided", () => {
      expectPromiseToFailWithError(
        pgDiscussionRepository.hasDiscussionMatching({}),
        errors.discussion.hasDiscussionMissingParams(),
      );
    });
  });

  describe("insert/update/getById", () => {
    it("insert with acquisitionCampaign and acquisitionKeyword", async () => {
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

    it("insert with status and conventionId", async () => {
      const siret = "01234567891011";
      const discussion = new DiscussionBuilder()
        .withSiret(siret)
        .withCreatedAt(new Date("2023-07-07"))
        .withStatus("ACCEPTED")
        .withConventionId("some-convention-id")
        .build();

      await pgDiscussionRepository.insert(discussion);

      expectToEqual(
        await db
          .selectFrom("discussions")
          .select(["status", "convention_id"])
          .executeTakeFirst(),
        {
          status: "ACCEPTED",
          convention_id: "some-convention-id",
        },
      );
    });

    it("update with status REJECTED and conventionId", async () => {
      const siret = "01234567891011";
      const discussion = new DiscussionBuilder()
        .withSiret(siret)
        .withCreatedAt(new Date("2023-07-07"))
        .withStatus("PENDING")
        .build();

      await pgDiscussionRepository.insert(discussion);

      const updatedDiscussion = new DiscussionBuilder(discussion)
        .withStatus("REJECTED", "UNABLE_TO_HELP")
        .withConventionId("some-other-convention-id")
        .build();

      await pgDiscussionRepository.update(updatedDiscussion);

      expectToEqual(
        await db
          .selectFrom("discussions")
          .select(["status", "convention_id"])
          .executeTakeFirst(),
        {
          status: "REJECTED",
          convention_id: "some-other-convention-id",
        },
      );
    });

    it("update with status REJECTED with reason", async () => {
      const siret = "01234567891011";
      const discussion = new DiscussionBuilder()
        .withSiret(siret)
        .withCreatedAt(new Date("2023-07-07"))
        .withStatus("PENDING")
        .build();

      await pgDiscussionRepository.insert(discussion);

      const updatedDiscussion = new DiscussionBuilder(discussion)
        .withStatus("REJECTED", "OTHER", "my custom reason")
        .build();

      await pgDiscussionRepository.update(updatedDiscussion);

      expectToEqual(
        await db
          .selectFrom("discussions")
          .select(["status", "rejection_reason"])
          .executeTakeFirst(),
        {
          status: "REJECTED",
          rejection_reason: "my custom reason",
        },
      );
    });

    it("update with status ACCEPTED", async () => {
      const siret = "01234567891011";
      const discussion = new DiscussionBuilder()
        .withSiret(siret)
        .withCreatedAt(new Date("2023-07-07"))
        .withStatus("PENDING")
        .build();

      await pgDiscussionRepository.insert(discussion);

      const updatedDiscussion = new DiscussionBuilder(discussion)
        .withStatus("ACCEPTED")
        .build();

      await pgDiscussionRepository.update(updatedDiscussion);

      expectToEqual(
        await db
          .selectFrom("discussions")
          .select(["status"])
          .executeTakeFirst(),
        {
          status: "ACCEPTED",
        },
      );
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

      const discussionWithRecentExchange = new DiscussionBuilder()
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
            attachments: [],
          },
        ])
        .build();

      const discussionWithOldExchange = new DiscussionBuilder()
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
            attachments: [
              {
                link: "dlskfjsdmlfsdmlfjsdmlfj",
                name: "pj",
              },
            ],
          },
        ])
        .build();

      await Promise.all([
        pgDiscussionRepository.insert(discussionWithRecentExchange),
        pgDiscussionRepository.insert(discussionWithOldExchange),
      ]);

      const numberOfUpdatedMessages =
        await pgDiscussionRepository.deleteOldMessages(since);

      expectToEqual(numberOfUpdatedMessages, 1);

      expectToEqual(
        await pgDiscussionRepository.getById(discussionWithRecentExchange.id),
        discussionWithRecentExchange,
      );

      expectToEqual(
        await pgDiscussionRepository.getById(discussionWithOldExchange.id),
        new DiscussionBuilder(discussionWithOldExchange)
          .withExchanges([
            {
              ...discussionWithOldExchange.exchanges[0],
              message: "Supprimé car trop ancien",
              attachments: [],
            },
          ])
          .build(),
      );
    });
  });

  describe("countDiscussionsForSiretSince", () => {
    it("right path", async () => {
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
        await pgDiscussionRepository.countDiscussionsForSiretSince(
          siret,
          since,
        );
      expect(numberOfDiscussions).toBe(2);
    });
  });
});
