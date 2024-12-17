import { subMonths } from "date-fns";
import { Pool } from "pg";
import {
  AgencyDtoBuilder,
  ConventionDtoBuilder,
  DiscussionBuilder,
  Exchange,
  UserBuilder,
  expectToEqual,
} from "shared";
import { KyselyDb, makeKyselyDb } from "../../../config/pg/kysely/kyselyUtils";
import { getTestPgPool } from "../../../config/pg/pgUtils";
import { toAgencyWithRights } from "../../../utils/agency";
import { PgAgencyRepository } from "../../agency/adapters/PgAgencyRepository";
import { PgConventionRepository } from "../../convention/adapters/PgConventionRepository";
import { PgUserRepository } from "../../core/authentication/inclusion-connect/adapters/PgUserRepository";
import { UuidV4Generator } from "../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import { EstablishmentAggregateBuilder } from "../helpers/EstablishmentBuilders";
import { PgDiscussionRepository } from "./PgDiscussionRepository";
import { PgEstablishmentAggregateRepository } from "./PgEstablishmentAggregateRepository";
import {
  deactivateUnresponsiveEstablishmentsQuery,
  updateAllEstablishmentScoresQuery,
} from "./PgEstablishmentAggregateRepository.sql";

describe("SQL queries, independent from PgEstablishmentAggregateRepository", () => {
  let pool: Pool;
  let db: KyselyDb;
  let pgEstablishmentAggregateRepository: PgEstablishmentAggregateRepository;
  let pgDiscussionRepository: PgDiscussionRepository;
  let pgConventionRepository: PgConventionRepository;
  let pgAgencyRepository: PgAgencyRepository;
  let pgUserRepository: PgUserRepository;

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
    await db.deleteFrom("users").execute();

    pgEstablishmentAggregateRepository = new PgEstablishmentAggregateRepository(
      db,
    );
    pgDiscussionRepository = new PgDiscussionRepository(db);
    pgConventionRepository = new PgConventionRepository(db);
    pgAgencyRepository = new PgAgencyRepository(db);
    pgUserRepository = new PgUserRepository(db);
  });

  afterAll(async () => {
    await pool.end();
  });

  describe("updateAllEstablishmentScoresQuery", () => {
    it("updates all the establishments scores, depending on the number of conventions and discussion answered in the last year", async () => {
      const user = new UserBuilder()
        .withId(new UuidV4Generator().new())
        .build();
      const establishment = new EstablishmentAggregateBuilder()
        .withScore(0)
        .withUserRights([
          {
            role: "establishment-admin",
            job: "",
            phone: "",
            userId: user.id,
          },
        ])
        .build();
      const { siret } = establishment.establishment;

      const agency = new AgencyDtoBuilder().build();
      await new PgUserRepository(db).save(user, "proConnect");
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

  describe("deactivateUnresponsiveEstablishmentsQuery", () => {
    const testUser = new UserBuilder()
      .withId("11111111-1111-4444-1111-111111111111")
      .build();

    beforeEach(async () => {
      await pgUserRepository.save(testUser, "proConnect");
    });

    it("deactivates establishments with 50+ unanswered discussions and no recent conventions", async () => {
      // Create establishment that should be deactivated
      const establishment = new EstablishmentAggregateBuilder()
        .withEstablishmentSiret("12345678901234")
        .withMaxContactsPerMonth(10)
        .withUserRights([
          {
            role: "establishment-admin",
            userId: testUser.id,
            job: "",
            phone: "",
          },
        ])
        .build();

      // Create 50 unanswered discussions
      const discussions = Array.from({ length: 50 }, (_, i) =>
        new DiscussionBuilder()
          .withSiret(establishment.establishment.siret)
          .withCreatedAt(new Date())
          .withId(
            `00000000-0000-4000-b000-00000000${i.toString().padStart(4, "0")}`,
          )
          .withExchanges([
            {
              subject: "Hello",
              message: "Initial message",
              sender: "potentialBeneficiary",
              recipient: "establishment",
              sentAt: new Date().toISOString(),
              attachments: [],
            },
          ])
          .build(),
      );

      // Insert test data
      await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
        establishment,
      );
      await Promise.all(
        discussions.map((d) => pgDiscussionRepository.insert(d)),
      );

      // Run the deactivation query
      await deactivateUnresponsiveEstablishmentsQuery(db);

      // Verify the establishment was deactivated using direct DB query
      const result = await db
        .selectFrom("establishments")
        .select(["max_contacts_per_month", "status", "status_updated_at"])
        .where("siret", "=", establishment.establishment.siret)
        .executeTakeFirst();

      expectToEqual(result?.max_contacts_per_month, 0);
      expectToEqual(result?.status, "DEACTIVATED_FOR_LACK_OF_RESPONSES");
      expect(result?.status_updated_at).toBeDefined();
    });

    it("does not deactivate establishments with recent conventions", async () => {
      // Create establishment
      const establishment = new EstablishmentAggregateBuilder()
        .withEstablishmentSiret("12345678901234")
        .withMaxContactsPerMonth(10)
        .withUserRights([
          {
            role: "establishment-admin",
            userId: testUser.id,
            job: "",
            phone: "",
          },
        ])
        .build();

      // Create agency and convention
      const agency = new AgencyDtoBuilder().build();
      await pgAgencyRepository.insert(toAgencyWithRights(agency));

      const convention = new ConventionDtoBuilder()
        .withSiret(establishment.establishment.siret)
        .withStatus("ACCEPTED_BY_VALIDATOR")
        .withAgencyId(agency.id)
        .withDateStart(new Date().toISOString())
        .build();

      // Create 50 unanswered discussions
      const discussions = Array.from({ length: 50 }, (_, i) =>
        new DiscussionBuilder()
          .withSiret(establishment.establishment.siret)
          .withCreatedAt(new Date())
          .withId(
            `00000000-0000-4000-b000-00000000${i.toString().padStart(4, "0")}`,
          )
          .withExchanges([
            {
              subject: "Hello",
              message: "Initial message",
              sender: "potentialBeneficiary",
              recipient: "establishment",
              sentAt: new Date().toISOString(),
              attachments: [],
            },
          ])
          .build(),
      );

      // Insert test data
      await pgEstablishmentAggregateRepository.insertEstablishmentAggregate(
        establishment,
      );
      await pgConventionRepository.save(convention);
      await Promise.all(
        discussions.map((d) => pgDiscussionRepository.insert(d)),
      );

      // Run the deactivation query
      await deactivateUnresponsiveEstablishmentsQuery(db);

      // Verify the establishment was not deactivated using direct DB query
      const result = await db
        .selectFrom("establishments")
        .select(["max_contacts_per_month", "status", "status_updated_at"])
        .where("siret", "=", establishment.establishment.siret)
        .executeTakeFirst();

      expectToEqual(result?.max_contacts_per_month, 10);
      expectToEqual(result?.status, null);
    });
  });
});
