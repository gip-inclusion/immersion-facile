import { addDays, addHours, subDays } from "date-fns";
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
import {
  PgEstablishmentAggregateRepository,
  createGetAppellationsByCode,
} from "./PgEstablishmentAggregateRepository";

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
    establishmentAggregateRepo = new PgEstablishmentAggregateRepository(
      db,
      createGetAppellationsByCode(db),
    );
  });

  afterAll(async () => {
    await pool.end();
  });

  describe("getDiscussions", () => {
    describe("unit filter param", () => {
      describe("siret filter param", () => {
        const discussionWithSiret1 = new DiscussionBuilder()
          .withId(uuid())
          .withCreatedAt(new Date("2024-01-01"))
          .withSiret("00000000000001")
          .build();
        const discussionWithSiret2 = new DiscussionBuilder(discussionWithSiret1)
          .withId(uuid())
          .withCreatedAt(new Date("2024-01-02"))
          .build();
        const discussionWithoutSiret = new DiscussionBuilder()
          .withId(uuid())
          .withCreatedAt(new Date("2024-01-03"))
          .withSiret("00000000000002")
          .build();
        beforeEach(async () => {
          await pgDiscussionRepository.insert(discussionWithSiret1);
          await pgDiscussionRepository.insert(discussionWithSiret2);
          await pgDiscussionRepository.insert(discussionWithoutSiret);
        });

        it("exclude discussion that do not have siret in filter", async () => {
          expectToEqual(
            await pgDiscussionRepository.getDiscussions({
              filters: {
                sirets: [discussionWithSiret1.siret],
              },
              limit: 5,
            }),
            [discussionWithSiret2, discussionWithSiret1],
          );
        });

        it("include all discussions that have sirets in filter", async () => {
          expectToEqual(
            await pgDiscussionRepository.getDiscussions({
              filters: {
                sirets: [
                  discussionWithSiret1.siret,
                  discussionWithoutSiret.siret,
                ],
              },
              limit: 5,
            }),
            [
              discussionWithoutSiret,
              discussionWithSiret2,
              discussionWithSiret1,
            ],
          );
        });

        it("exclude all discussions if siret in filter does not match any discussion siret", async () => {
          expectToEqual(
            await pgDiscussionRepository.getDiscussions({
              filters: {
                sirets: ["99999999999999"],
              },
              limit: 5,
            }),
            [],
          );
        });

        it("throws if siret filter is provided but empty", async () => {
          await expectPromiseToFailWithError(
            pgDiscussionRepository.getDiscussions({
              filters: {
                sirets: [],
              },
              limit: 5,
            }),
            errors.discussion.badSiretFilter(),
          );
        });
      });

      describe("createdSince filter param", () => {
        const discussionCreatedSince1 = new DiscussionBuilder()
          .withId(uuid())
          .withCreatedAt(new Date("2024-01-01"))
          .build();
        const discussionCreatedSince2 = new DiscussionBuilder()
          .withId(uuid())
          .withCreatedAt(new Date("2024-01-02"))
          .build();
        const discussionCreatedBefore = new DiscussionBuilder()
          .withId(uuid())
          .withCreatedAt(new Date("2023-12-31"))
          .build();

        beforeEach(async () => {
          await pgDiscussionRepository.insert(discussionCreatedSince1);
          await pgDiscussionRepository.insert(discussionCreatedSince2);
          await pgDiscussionRepository.insert(discussionCreatedBefore);
        });

        it("exclude discussions created before", async () => {
          expectToEqual(
            await pgDiscussionRepository.getDiscussions({
              filters: {
                createdSince: new Date(discussionCreatedSince1.createdAt),
              },
              limit: 10,
            }),
            [discussionCreatedSince2, discussionCreatedSince1],
          );
        });
        it("include all discussions if created since date is the creation date of the oldest discussion", async () => {
          expectToEqual(
            await pgDiscussionRepository.getDiscussions({
              filters: {
                createdSince: new Date(discussionCreatedBefore.createdAt),
              },
              limit: 10,
            }),
            [
              discussionCreatedSince2,
              discussionCreatedSince1,
              discussionCreatedBefore,
            ],
          );
        });
        it("exclude all discussions if created since date is after of the most recent discussion", async () => {
          expectToEqual(
            await pgDiscussionRepository.getDiscussions({
              filters: {
                createdSince: new Date("2024-01-03"),
              },
              limit: 10,
            }),
            [],
          );
        });
      });

      describe("createdBetween filter param", () => {
        const discussionCreatedBefore = new DiscussionBuilder()
          .withId(uuid())
          .withCreatedAt(new Date("2024-08-01 23:59:59"))
          .build();
        const discussionCreatedBetween1 = new DiscussionBuilder()
          .withId(uuid())
          .withCreatedAt(new Date("2024-08-02 00:00:00"))
          .build();
        const discussionCreatedBetween2 = new DiscussionBuilder()
          .withId(uuid())
          .withCreatedAt(new Date("2024-08-03 00:00:00"))
          .build();
        const discussionCreatedAfter = new DiscussionBuilder()
          .withId(uuid())
          .withCreatedAt(new Date("2024-08-03 00:00:01"))
          .build();

        beforeEach(async () => {
          await pgDiscussionRepository.insert(discussionCreatedBefore);
          await pgDiscussionRepository.insert(discussionCreatedBetween1);
          await pgDiscussionRepository.insert(discussionCreatedBetween2);
          await pgDiscussionRepository.insert(discussionCreatedAfter);
        });

        it("include discussion with created at exactly of created between ranges", async () => {
          expectToEqual(
            await pgDiscussionRepository.getDiscussions({
              filters: {
                createdBetween: {
                  from: new Date("2024-08-02 00:00:00"),
                  to: new Date("2024-08-03 00:00:00"),
                },
              },
              limit: 5,
            }),
            [discussionCreatedBetween2, discussionCreatedBetween1],
          );
        });
        it("include discussion with created at very close of created between range", async () => {
          expectToEqual(
            await pgDiscussionRepository.getDiscussions({
              filters: {
                createdBetween: {
                  from: new Date("2024-08-01 23:59:59:999"),
                  to: new Date("2024-08-02 00:00:00:001"),
                },
              },
              limit: 5,
            }),
            [discussionCreatedBetween1],
          );
        });
        it("exclude all discussions with created between range out of discussions created at", async () => {
          expectToEqual(
            await pgDiscussionRepository.getDiscussions({
              filters: {
                createdBetween: {
                  from: new Date("2024-08-03 00:00:01:001"),
                  to: new Date("2024-08-04 00:00:00"),
                },
              },
              limit: 5,
            }),
            [],
          );
        });
      });

      describe("answeredByEstablishment filter param", () => {
        const discussionNotAnsweredByEstablishment = new DiscussionBuilder()
          .withId(uuid())
          .withExchanges([
            {
              sender: "potentialBeneficiary",
              recipient: "establishment",
              message: "",
              attachments: [],
              sentAt: new Date().toISOString(),
              subject: "",
            },
          ])
          .build();
        const discussionAnsweredByEstablishment = new DiscussionBuilder()
          .withId(uuid())
          .withExchanges([
            {
              sender: "establishment",
              recipient: "potentialBeneficiary",
              message: "",
              attachments: [],
              sentAt: new Date().toISOString(),
              subject: "",
            },
          ])
          .build();

        beforeEach(async () => {
          await pgDiscussionRepository.insert(
            discussionAnsweredByEstablishment,
          );
          await pgDiscussionRepository.insert(
            discussionNotAnsweredByEstablishment,
          );
        });

        it("include only discussions answered by establishment", async () => {
          expectToEqual(
            await pgDiscussionRepository.getDiscussions({
              filters: {
                answeredByEstablishment: true,
              },
              limit: 5,
            }),
            [discussionAnsweredByEstablishment],
          );
        });

        it("include only discussions not answered by establishment", async () => {
          expectToEqual(
            await pgDiscussionRepository.getDiscussions({
              filters: {
                answeredByEstablishment: false,
              },
              limit: 5,
            }),
            [discussionNotAnsweredByEstablishment],
          );
        });
      });
    });
    describe("combo filters", () => {
      it("exclude discussions that does not match filters", async () => {
        type ReducedExchange = Pick<Exchange, "sender" | "recipient">;
        const sendedByBeneficiary: ReducedExchange = {
          sender: "potentialBeneficiary",
          recipient: "establishment",
        };
        const sendedByEstablishment: ReducedExchange = {
          sender: "establishment",
          recipient: "potentialBeneficiary",
        };

        const date = new Date("2024-08-02 00:00:00");
        const discussionToMatchWithLotOfExchanges = new DiscussionBuilder()
          .withId(uuid())
          .withCreatedAt(date)
          .withStatus("PENDING")
          .withExchanges(
            [
              sendedByBeneficiary,
              sendedByEstablishment,
              sendedByBeneficiary,
              sendedByBeneficiary,
              sendedByEstablishment,
              sendedByEstablishment,
              sendedByBeneficiary,
              sendedByBeneficiary,
              sendedByBeneficiary,
              sendedByBeneficiary,
              sendedByEstablishment,
            ].map((rest, index) => ({
              ...rest,
              message: "",
              subject: "",
              attachments: [],
              sentAt: addHours(new Date(date), index).toISOString(),
            })),
          )
          .build();
        const discussionToMatchWithOneExchangeOfEach = new DiscussionBuilder(
          discussionToMatchWithLotOfExchanges,
        )
          .withId(uuid())
          .withExchanges(
            [sendedByBeneficiary, sendedByEstablishment].map((rest, index) => ({
              ...rest,
              message: "",
              subject: "",
              attachments: [],
              sentAt: addHours(new Date(date), index).toISOString(),
            })),
          )
          .withCreatedAt(
            addHours(
              new Date(discussionToMatchWithLotOfExchanges.createdAt),
              1,
            ),
          )
          .build();
        const discussionBadSiret = new DiscussionBuilder(
          discussionToMatchWithLotOfExchanges,
        )
          .withId(uuid())
          .withSiret("99999999999999")
          .build();
        const discussionCreatedAtBelowRange = new DiscussionBuilder(
          discussionToMatchWithLotOfExchanges,
        )
          .withId(uuid())
          .withCreatedAt(subDays(new Date(discussionBadSiret.createdAt), 1))
          .build();
        const discussionCreatedAfterRange = new DiscussionBuilder(
          discussionToMatchWithLotOfExchanges,
        )
          .withId(uuid())
          .withCreatedAt(addDays(new Date(discussionBadSiret.createdAt), 1))
          .build();
        const discussionNotAnsweredByEstablishment = new DiscussionBuilder(
          discussionToMatchWithLotOfExchanges,
        )
          .withId(uuid())
          .withExchanges([
            {
              attachments: [],
              message: "",
              subject: "",
              sentAt: new Date().toISOString(),
              recipient: "establishment",
              sender: "potentialBeneficiary",
            },
          ])
          .build();

        await pgDiscussionRepository.insert(
          discussionToMatchWithLotOfExchanges,
        );
        await pgDiscussionRepository.insert(
          discussionToMatchWithOneExchangeOfEach,
        );
        await pgDiscussionRepository.insert(discussionBadSiret);
        await pgDiscussionRepository.insert(discussionCreatedAtBelowRange);
        await pgDiscussionRepository.insert(discussionCreatedAfterRange);
        await pgDiscussionRepository.insert(
          discussionNotAnsweredByEstablishment,
        );

        expectToEqual(
          await pgDiscussionRepository.getDiscussions({
            filters: {
              answeredByEstablishment: true,
              status: discussionToMatchWithLotOfExchanges.status,
              createdBetween: {
                from: new Date(discussionToMatchWithLotOfExchanges.createdAt),
                to: new Date(discussionToMatchWithOneExchangeOfEach.createdAt),
              },
              sirets: [discussionToMatchWithLotOfExchanges.siret],
              createdSince: new Date(
                discussionToMatchWithLotOfExchanges.createdAt,
              ),
            },
            limit: 5,
          }),
          [
            discussionToMatchWithOneExchangeOfEach,
            discussionToMatchWithLotOfExchanges,
          ],
        );
      });
    });
  });

  describe("hasDiscussionMatching", () => {
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
            sentAt: new Date("2023-07-07").toISOString(),
            subject: "exchange with potentialBeneficiary 1",
            attachments: [
              {
                link: "magicTokenBrevo",
                name: "monPdf.pdf",
              },
            ],
          },
        ])
        .withCreatedAt(new Date("2023-07-07"))
        .build();

    const discussionWithoutExchanges3 = new DiscussionBuilder()
      .withId(uuid())
      .withSiret("00000000000002")
      .withExchanges([])
      .withConventionId("some-convention-id")
      .withCreatedAt(new Date("2023-07-05"))
      .build();

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

    it("also returns discussion if discussion is searched by contact email and email is in copyEmails", async () => {
      const discussion = new DiscussionBuilder()
        .withId(uuid())
        .withEstablishmentContact({
          email: "other@email.com",
          copyEmails: ["searchedEmail@email.com"],
        })
        .build();
      await pgDiscussionRepository.insert(discussion);

      expectToEqual(
        await pgDiscussionRepository.hasDiscussionMatching({
          establishmentRepresentativeEmail: "searchedEmail@email.com",
        }),
        true,
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
