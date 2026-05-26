import type { Pool } from "pg";
import {
  AgencyDtoBuilder,
  ConventionDtoBuilder,
  type ConventionId,
  expectToEqual,
} from "shared";
import { v4 as uuid } from "uuid";
import { type KyselyDb, makeKyselyDb } from "../config/pg/kysely/kyselyUtils";
import { makeTestPgPool } from "../config/pg/pgPool";
import { PgAgencyRepository } from "../domains/agency/adapters/PgAgencyRepository";
import { PgConventionRepository } from "../domains/convention/adapters/PgConventionRepository";
import { PgUserRepository } from "../domains/core/authentication/connected-user/adapters/PgUserRepository";
import { toAgencyWithRights } from "../utils/agency";
import { makeUniqueUserForTest } from "../utils/user";
import { backfillBroadcastFeedbackIds } from "./backfillBroadcastFeedbackIds";

describe("backfillBroadcastFeedbackIds", () => {
  let pool: Pool;
  let db: KyselyDb;

  beforeAll(() => {
    pool = makeTestPgPool();
    db = makeKyselyDb(pool);
  });

  afterAll(async () => {
    await pool.end();
  });

  beforeEach(async () => {
    await db.deleteFrom("broadcast_feedbacks").execute();
    await db.deleteFrom("conventions").execute();
    await db.deleteFrom("actors").execute();
    await db.deleteFrom("users__agencies").execute();
    await db.deleteFrom("agencies").execute();
    await db.deleteFrom("users").execute();
  });

  it("backfills convention_id for all rows and agency_id only for rows whose convention still exists", async () => {
    const agency = new AgencyDtoBuilder().withId(uuid()).build();
    const validator = makeUniqueUserForTest(uuid());
    await new PgUserRepository(db).save(validator);
    await new PgAgencyRepository(db).insert(
      toAgencyWithRights(agency, {
        [validator.id]: { isNotifiedByEmail: true, roles: ["validator"] },
      }),
    );

    const existingConventionId: ConventionId =
      "11111111-1111-4111-8111-111111111111";
    const orphanConventionId: ConventionId =
      "22222222-2222-4222-8222-222222222222";

    const convention = new ConventionDtoBuilder()
      .withId(existingConventionId)
      .withAgencyId(agency.id)
      .build();
    await new PgConventionRepository(db).save(convention);

    await db
      .insertInto("broadcast_feedbacks")
      .values([
        {
          service_name: "osef",
          consumer_name: "my-consumer",
          consumer_id: null,
          request_params: JSON.stringify({
            conventionId: existingConventionId,
          }),
          response: JSON.stringify({ httpStatus: 500 }),
          occurred_at: new Date("2024-07-31").toISOString(),
          handled_by_agency: false,
          convention_id: null,
          agency_id: null,
        },
        {
          service_name: "osef",
          consumer_name: "my-consumer",
          consumer_id: null,
          request_params: JSON.stringify({
            conventionId: orphanConventionId,
          }),
          response: JSON.stringify({ httpStatus: 500 }),
          occurred_at: new Date("2024-07-31").toISOString(),
          handled_by_agency: false,
          convention_id: null,
          agency_id: null,
        },
      ])
      .execute();

    const summary = await backfillBroadcastFeedbackIds(db);

    expectToEqual(summary, {
      totalConventionIdUpdated: 2,
      totalAgencyIdUpdated: 1,
      remainingOrphanAgencyIds: 1,
      invalidLegacyConventionIds: 0,
      conventionIdStoppedByMaxBatches: false,
      agencyIdStoppedByMaxBatches: false,
    });

    const rows = await db
      .selectFrom("broadcast_feedbacks")
      .select(["request_params", "convention_id", "agency_id"])
      .execute();

    const existingRow = rows.find(
      (r) => r.request_params.conventionId === existingConventionId,
    );
    const orphanRow = rows.find(
      (r) => r.request_params.conventionId === orphanConventionId,
    );

    expectToEqual(existingRow?.convention_id, existingConventionId);
    expectToEqual(existingRow?.agency_id, agency.id);
    expectToEqual(orphanRow?.convention_id, orphanConventionId);
    expectToEqual(orphanRow?.agency_id, null);
  });

  it("continues backfilling agency_id when orphan rows are before valid rows", async () => {
    const agency = new AgencyDtoBuilder().withId(uuid()).build();
    const validator = makeUniqueUserForTest(uuid());
    await new PgUserRepository(db).save(validator);
    await new PgAgencyRepository(db).insert(
      toAgencyWithRights(agency, {
        [validator.id]: { isNotifiedByEmail: true, roles: ["validator"] },
      }),
    );

    const orphanConventionId: ConventionId =
      "33333333-3333-4333-8333-333333333333";
    const existingConventionId: ConventionId =
      "44444444-4444-4444-8444-444444444444";

    await new PgConventionRepository(db).save(
      new ConventionDtoBuilder()
        .withId(existingConventionId)
        .withAgencyId(agency.id)
        .build(),
    );

    await db
      .insertInto("broadcast_feedbacks")
      .values({
        service_name: "osef",
        consumer_name: "my-consumer",
        consumer_id: null,
        request_params: JSON.stringify({ conventionId: orphanConventionId }),
        response: JSON.stringify({ httpStatus: 500 }),
        occurred_at: new Date("2024-07-31").toISOString(),
        handled_by_agency: false,
        convention_id: null,
        agency_id: null,
      })
      .execute();

    await db
      .insertInto("broadcast_feedbacks")
      .values({
        service_name: "osef",
        consumer_name: "my-consumer",
        consumer_id: null,
        request_params: JSON.stringify({ conventionId: existingConventionId }),
        response: JSON.stringify({ httpStatus: 500 }),
        occurred_at: new Date("2024-07-31").toISOString(),
        handled_by_agency: false,
        convention_id: null,
        agency_id: null,
      })
      .execute();

    const summary = await backfillBroadcastFeedbackIds(db, { batchSize: 1 });

    expectToEqual(summary, {
      totalConventionIdUpdated: 2,
      totalAgencyIdUpdated: 1,
      remainingOrphanAgencyIds: 1,
      invalidLegacyConventionIds: 0,
      conventionIdStoppedByMaxBatches: false,
      agencyIdStoppedByMaxBatches: false,
    });

    const validRow = await db
      .selectFrom("broadcast_feedbacks")
      .select(["agency_id"])
      .where("convention_id", "=", existingConventionId)
      .executeTakeFirstOrThrow();

    expectToEqual(validRow.agency_id, agency.id);
  });

  it("skips legacy rows without convention ids instead of blocking valid rows", async () => {
    const validConventionId: ConventionId =
      "55555555-5555-4555-8555-555555555555";

    await db
      .insertInto("broadcast_feedbacks")
      .values([
        {
          service_name: "osef",
          consumer_name: "my-consumer",
          consumer_id: null,
          request_params: JSON.stringify({}),
          response: JSON.stringify({ httpStatus: 500 }),
          occurred_at: new Date("2024-07-31").toISOString(),
          handled_by_agency: false,
          convention_id: null,
          agency_id: null,
        },
        {
          service_name: "osef",
          consumer_name: "my-consumer",
          consumer_id: null,
          request_params: JSON.stringify({ conventionId: validConventionId }),
          response: JSON.stringify({ httpStatus: 500 }),
          occurred_at: new Date("2024-07-31").toISOString(),
          handled_by_agency: false,
          convention_id: null,
          agency_id: null,
        },
      ])
      .execute();

    const summary = await backfillBroadcastFeedbackIds(db, { batchSize: 1 });

    expectToEqual(summary, {
      totalConventionIdUpdated: 1,
      totalAgencyIdUpdated: 0,
      remainingOrphanAgencyIds: 1,
      invalidLegacyConventionIds: 1,
      conventionIdStoppedByMaxBatches: false,
      agencyIdStoppedByMaxBatches: false,
    });
  });

  it("reports when a phase stops because max batches is reached", async () => {
    const firstConventionId: ConventionId =
      "66666666-6666-4666-8666-666666666666";
    const secondConventionId: ConventionId =
      "77777777-7777-4777-8777-777777777777";

    await db
      .insertInto("broadcast_feedbacks")
      .values(
        [firstConventionId, secondConventionId].map((conventionId) => ({
          service_name: "osef",
          consumer_name: "my-consumer",
          consumer_id: null,
          request_params: JSON.stringify({ conventionId }),
          response: JSON.stringify({ httpStatus: 500 }),
          occurred_at: new Date("2024-07-31").toISOString(),
          handled_by_agency: false,
          convention_id: null,
          agency_id: null,
        })),
      )
      .execute();

    const summary = await backfillBroadcastFeedbackIds(db, {
      batchSize: 1,
      maxBatchesPerPhase: 1,
    });

    expectToEqual(summary, {
      totalConventionIdUpdated: 1,
      totalAgencyIdUpdated: 0,
      remainingOrphanAgencyIds: 1,
      invalidLegacyConventionIds: 0,
      conventionIdStoppedByMaxBatches: true,
      agencyIdStoppedByMaxBatches: false,
    });
  });
});
