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
import { v4 as uuid } from "uuid";
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

  const date = new Date("2023-07-07");

  const discussionWithLastExchangeByPotentialBeneficiary =
    new DiscussionBuilder()
      .withId(uuid())
      .withSiret("00000000000001")
      .withEstablishmentContact({
        email: "TEST@email.com",
      })
      .withExchanges([
        {
          message: "",
          sender: "potentialBeneficiary",
          recipient: "establishment",
          sentAt: date.toISOString(),
          subject: "",
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
  const discussionWithLastExchangeByEstablishment = new DiscussionBuilder()
    .withId(uuid())
    .withSiret("00000000000003")
    .withExchanges([
      {
        message: "",
        recipient: "potentialBeneficiary",
        sender: "establishment",
        sentAt: date.toISOString(),
        subject: "",
        attachments: [],
      },
    ])
    .withCreatedAt(date)
    .build();
  const discussionWithoutExchanges = new DiscussionBuilder()
    .withId(uuid())
    .withSiret("00000000000002")
    .withExchanges([])
    .withConventionId("some-convention-id")
    .withCreatedAt(addDays(date, -1))
    .build();

  describe("getDiscussions", () => {
    //TODO getDiscussions with lastAnsweredByCandidate parameter
    it.each([
      {
        params: {
          sirets: [discussionWithLastExchangeByPotentialBeneficiary.siret],
        },
        result: [discussionWithLastExchangeByPotentialBeneficiary],
      },
      {
        params: {
          createdSince: addDays(date, -2),
        },
        result: [
          discussionWithLastExchangeByPotentialBeneficiary,
          discussionWithLastExchangeByEstablishment,
          discussionWithoutExchanges,
        ],
      },
      {
        params: {
          lastAnsweredByCandidate: {
            from: addDays(date, -1),
            to: date,
          },
        },
        result: [discussionWithLastExchangeByPotentialBeneficiary],
      },
      {
        params: {
          sirets: [discussionWithoutExchanges.siret],
          lastAnsweredByCandidate: {
            from: addDays(date, -1),
            to: date,
          },
        },
        result: [],
      },
    ] satisfies {
      params: GetDiscussionsParams;
      result: DiscussionDto[] | Error;
    }[])(
      `getDiscussions return $result.length discussion with params:
        $params
        `,
      async ({ params, result }) => {
        await Promise.all(
          [
            discussionWithLastExchangeByPotentialBeneficiary,
            discussionWithLastExchangeByEstablishment,
            discussionWithoutExchanges,
          ].map((discussion) => pgDiscussionRepository.insert(discussion)),
        );

        result instanceof Error
          ? expectPromiseToFailWithError(
              pgDiscussionRepository.getDiscussions(params, 3),
              result,
            )
          : expectToEqual(
              await pgDiscussionRepository.getDiscussions(params, 3),
              result,
            );
      },
    );
  });

  describe("hasDiscussionMatching", () => {
    it.each([
      {
        discussionInRepo: discussionWithLastExchangeByPotentialBeneficiary,
        params: {
          siret: discussionWithLastExchangeByPotentialBeneficiary.siret,
        },
        result: true,
      },
      {
        discussionInRepo: discussionWithLastExchangeByPotentialBeneficiary,
        params: {
          siret: discussionWithoutExchanges.siret,
        },
        result: false,
      },
      {
        discussionInRepo: discussionWithLastExchangeByPotentialBeneficiary,
        params: {
          appellationCode:
            discussionWithLastExchangeByPotentialBeneficiary.appellationCode,
        },
        result: true,
      },
      {
        discussionInRepo: discussionWithLastExchangeByPotentialBeneficiary,
        params: {
          potentialBeneficiaryEmail:
            discussionWithLastExchangeByPotentialBeneficiary
              .potentialBeneficiary.email,
        },
        result: true,
      },
      {
        discussionInRepo: discussionWithLastExchangeByPotentialBeneficiary,
        params: {
          since: new Date(
            discussionWithLastExchangeByPotentialBeneficiary.createdAt,
          ),
        },
        result: true,
      },
      {
        discussionInRepo: discussionWithLastExchangeByPotentialBeneficiary,
        params: {
          establishmentRepresentativeEmail:
            discussionWithLastExchangeByPotentialBeneficiary.establishmentContact.email.toUpperCase(),
        },
        result: true,
      },
      {
        discussionInRepo: discussionWithLastExchangeByPotentialBeneficiary,
        params: {
          siret: discussionWithLastExchangeByPotentialBeneficiary.siret,
          appellationCode:
            discussionWithLastExchangeByPotentialBeneficiary.appellationCode,
          potentialBeneficiaryEmail:
            discussionWithLastExchangeByPotentialBeneficiary
              .potentialBeneficiary.email,
          since: date,
        },
        result: true,
      },
      {
        discussionInRepo: discussionWithLastExchangeByPotentialBeneficiary,
        params: {
          siret: discussionWithLastExchangeByPotentialBeneficiary.siret,
          appellationCode:
            discussionWithLastExchangeByPotentialBeneficiary.appellationCode,
          potentialBeneficiaryEmail:
            discussionWithLastExchangeByPotentialBeneficiary
              .potentialBeneficiary.email,
          since: addDays(date, 1),
        },
        result: false,
      },
      {
        discussionInRepo: discussionWithoutExchanges,
        params: {
          siret: discussionWithoutExchanges.siret,
          appellationCode: discussionWithoutExchanges.appellationCode,
          potentialBeneficiaryEmail:
            discussionWithoutExchanges.potentialBeneficiary.email,
          since: new Date(discussionWithoutExchanges.createdAt),
        },
        result: true,
      },
      {
        discussionInRepo: discussionWithoutExchanges,
        params: {
          siret: discussionWithLastExchangeByPotentialBeneficiary.siret,
          appellationCode:
            discussionWithLastExchangeByPotentialBeneficiary.appellationCode,
          potentialBeneficiaryEmail:
            discussionWithLastExchangeByPotentialBeneficiary
              .potentialBeneficiary.email,
          since: addDays(new Date(discussionWithoutExchanges.createdAt), 1),
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
            attachments: [],
          },
        ])
        .build();
      const discussionOldWithExchange = new DiscussionBuilder()
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
        pgDiscussionRepository.insert(discussion1),
        pgDiscussionRepository.insert(discussionOldWithExchange),
      ]);

      const numberOfUpdatedMessages =
        await pgDiscussionRepository.deleteOldMessages(since);

      expectToEqual(numberOfUpdatedMessages, 1);

      expectToEqual(
        await pgDiscussionRepository.getById(discussion1.id),
        discussion1,
      );
      expectToEqual(
        await pgDiscussionRepository.getById(discussionOldWithExchange.id),
        new DiscussionBuilder(discussionOldWithExchange)
          .withExchanges([
            {
              ...discussionOldWithExchange.exchanges[0],
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
