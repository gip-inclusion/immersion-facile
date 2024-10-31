import { subMonths } from "date-fns";
import { Pool } from "pg";
import {
  AgencyDtoBuilder,
  ConventionDtoBuilder,
  DiscussionBuilder,
  Exchange,
  expectToEqual,
} from "shared";
import { KyselyDb, makeKyselyDb } from "../../../config/pg/kysely/kyselyUtils";
import { getTestPgPool } from "../../../config/pg/pgUtils";
import { toAgencyWithRights } from "../../../utils/agency";
import { PgAgencyRepository } from "../../agency/adapters/PgAgencyRepository";
import { PgConventionRepository } from "../../convention/adapters/PgConventionRepository";
import { EstablishmentAggregateBuilder } from "../helpers/EstablishmentBuilders";
import { PgDiscussionRepository } from "./PgDiscussionRepository";
import { PgEstablishmentAggregateRepository } from "./PgEstablishmentAggregateRepository";
import { updateAllEstablishmentScoresQuery } from "./PgEstablishmentAggregateRepository.sql";

describe("SQL queries, independent from PgEstablishmentAggregateRepository", () => {
  let pool: Pool;
  let db: KyselyDb;

  beforeAll(async () => {
    pool = getTestPgPool();
    db = makeKyselyDb(pool);
  });

  beforeEach(async () => {
    await db.deleteFrom("establishments").execute();
    await db.deleteFrom("discussions").execute();
    await db.deleteFrom("conventions").execute();
    await db.deleteFrom("agency_groups__agencies").execute();
    await db.deleteFrom("agencies").execute();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe("updateAllEstablishmentScoresQuery", () => {
    it("updates all the establishments scores, depending on the number of conventions and discussion answered in the last year", async () => {
      const pgEstablishmentAggregateRepository =
        new PgEstablishmentAggregateRepository(db);

      const pgDiscussionRepository = new PgDiscussionRepository(db);
      const pgConventionRepository = new PgConventionRepository(db);
      const pgAgencyRepository = new PgAgencyRepository(db);

      const establishment = new EstablishmentAggregateBuilder()
        .withScore(0)
        .build();
      const { siret } = establishment.establishment;

      const agency = new AgencyDtoBuilder().build();
      await pgAgencyRepository.insert(toAgencyWithRights(agency));

      const convention = new ConventionDtoBuilder()
        .withSiret(siret)
        .withStatus("ACCEPTED_BY_VALIDATOR")
        .withAgencyId(agency.id)
        .withDateSubmission(new Date().toISOString())
        .build();

      await pgConventionRepository.save(convention);

      const initialExchange: Exchange = {
        subject: "Hello",
        message: "Initial message",
        sender: "potentialBeneficiary",
        recipient: "establishment",
        sentAt: new Date().toISOString(),
        attachments: [],
      };

      const discussionWithoutResponse = new DiscussionBuilder()
        .withSiret(siret)
        .withCreatedAt(new Date())
        .withExchanges([initialExchange])
        .build();

      const discussionWithResponse = new DiscussionBuilder()
        .withSiret(siret)
        .withCreatedAt(new Date())
        .withId("11111111-1111-4444-1111-111111111333")
        .withExchanges([
          initialExchange,
          {
            subject: "Yo",
            message: "my response",
            sender: "establishment",
            recipient: "potentialBeneficiary",
            sentAt: new Date().toISOString(),
            attachments: [],
          },
        ])
        .build();

      const discussionWithResponseButTooOld = new DiscussionBuilder()
        .withSiret(siret)
        .withCreatedAt(subMonths(new Date(), 13))
        .withId("22222222-1111-4444-1111-111111112222")
        .withExchanges([
          initialExchange,
          {
            subject: "Yo",
            message: "my response",
            sender: "establishment",
            recipient: "potentialBeneficiary",
            sentAt: new Date().toISOString(),
            attachments: [],
          },
        ])
        .build();

      await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
        establishment,
      );

      await Promise.all(
        [
          discussionWithoutResponse,
          discussionWithResponse,
          discussionWithResponseButTooOld,
        ].map((discussion) => pgDiscussionRepository.insert(discussion)),
      );

      await updateAllEstablishmentScoresQuery(db);

      const establishmentAfter =
        await pgEstablishmentAggregateRepository.getEstablishmentAggregateBySiret(
          siret,
        );

      const minimumScore = 10;
      const discussionScore = 1 / 2;
      const conventionScore = 20 * 1;
      const expectedScore = (minimumScore + conventionScore) * discussionScore;
      expectToEqual(establishmentAfter?.establishment.score, expectedScore);
    });
  });
});
