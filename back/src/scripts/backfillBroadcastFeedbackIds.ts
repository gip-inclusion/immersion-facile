import "./instrumentSentryCron";
import { type SqlBool, sql } from "kysely";
import { AppConfig } from "../config/bootstrap/appConfig";
import { type KyselyDb, makeKyselyDb } from "../config/pg/kysely/kyselyUtils";
import { createMakeScriptPgPool } from "../config/pg/pgPool";
import { createLogger } from "../utils/logger";
import { handleCRONScript } from "./handleCRONScript";

const logger = createLogger(__filename);
const config = AppConfig.createFromEnv();

const defaultBatchSize = 10_000;
const uuidRegexp =
  "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$";

type BackfillBroadcastFeedbackIdsOptions = {
  batchSize?: number;
  maxBatchesPerPhase?: number;
};

type BackfillBroadcastFeedbackIdsResult = {
  totalConventionIdUpdated: number;
  totalAgencyIdUpdated: number;
  remainingOrphanAgencyIds: number;
  invalidLegacyConventionIds: number;
  conventionIdStoppedByMaxBatches: boolean;
  agencyIdStoppedByMaxBatches: boolean;
};

type BackfillPhase = "convention_id" | "agency_id";

type BackfillPhaseResult = {
  totalUpdated: number;
  stoppedByMaxBatches: boolean;
};

const defaultMaxBatchesPerPhase =
  config.backfillBroadcastFeedbackMaxBatchesPerPhase ??
  Number.POSITIVE_INFINITY;

const fillConventionIdBatch = async (
  kysely: KyselyDb,
  batchSize: number,
): Promise<number> => {
  const res = await kysely
    .updateTable("broadcast_feedbacks")
    .set({
      convention_id: sql<string>`(broadcast_feedbacks.request_params ->> 'conventionId')::uuid`,
    })
    .where(
      sql<SqlBool>`broadcast_feedbacks.id = ANY(ARRAY(
        SELECT id
        FROM broadcast_feedbacks
        WHERE convention_id IS NULL
          AND request_params ->> 'conventionId' ~* ${uuidRegexp}
        ORDER BY id
        LIMIT ${batchSize}
      ))`,
    )
    .executeTakeFirst();
  return Number(res.numUpdatedRows);
};

const fillAgencyIdBatch = async (
  kysely: KyselyDb,
  batchSize: number,
): Promise<number> => {
  const res = await kysely
    .updateTable("broadcast_feedbacks")
    .from("conventions")
    .set((eb) => ({ agency_id: eb.ref("conventions.agency_id") }))
    .whereRef("broadcast_feedbacks.convention_id", "=", "conventions.id")
    .where(
      sql<SqlBool>`broadcast_feedbacks.id = ANY(ARRAY(
        SELECT bf.id
        FROM broadcast_feedbacks AS bf
        INNER JOIN conventions AS c ON c.id = bf.convention_id
        WHERE bf.agency_id IS NULL
          AND bf.convention_id IS NOT NULL
        ORDER BY bf.id
        LIMIT ${batchSize}
      ))`,
    )
    .executeTakeFirst();
  return Number(res.numUpdatedRows);
};

const runBackfillPhase = async ({
  phase,
  maxBatchesPerPhase,
  updateNextBatch,
}: {
  phase: BackfillPhase;
  maxBatchesPerPhase: number;
  updateNextBatch: () => Promise<number>;
}): Promise<BackfillPhaseResult> => {
  let totalUpdated = 0;
  let batchesRun = 0;
  let lastBatchUpdatedRows = 1;

  while (lastBatchUpdatedRows > 0 && batchesRun < maxBatchesPerPhase) {
    lastBatchUpdatedRows = await updateNextBatch();
    totalUpdated += lastBatchUpdatedRows;
    batchesRun += 1;
    logger.info({
      message: JSON.stringify({
        phase,
        batchRows: lastBatchUpdatedRows,
        totalSoFar: totalUpdated,
      }),
    });
  }

  return {
    totalUpdated,
    stoppedByMaxBatches: lastBatchUpdatedRows > 0,
  };
};

const countRemainingOrphanAgencyIds = async (
  kysely: KyselyDb,
): Promise<number> => {
  const row = await kysely
    .selectFrom("broadcast_feedbacks")
    .select((eb) => eb.fn.countAll<string>().as("count"))
    .where("agency_id", "is", null)
    .where("convention_id", "is not", null)
    .where(
      sql<SqlBool>`NOT EXISTS (
        SELECT 1
        FROM conventions
        WHERE conventions.id = broadcast_feedbacks.convention_id
      )`,
    )
    .executeTakeFirstOrThrow();
  return Number(row.count);
};

const countInvalidLegacyConventionIds = async (
  kysely: KyselyDb,
): Promise<number> => {
  const row = await kysely
    .selectFrom("broadcast_feedbacks")
    .select((eb) => eb.fn.countAll<string>().as("count"))
    .where("convention_id", "is", null)
    .where(
      sql<SqlBool>`COALESCE(request_params ->> 'conventionId', '') !~* ${uuidRegexp}`,
    )
    .executeTakeFirstOrThrow();
  return Number(row.count);
};

export const backfillBroadcastFeedbackIds = async (
  kysely: KyselyDb,
  {
    batchSize = defaultBatchSize,
    maxBatchesPerPhase = defaultMaxBatchesPerPhase,
  }: BackfillBroadcastFeedbackIdsOptions = {},
): Promise<BackfillBroadcastFeedbackIdsResult> => {
  const conventionIdPhase = await runBackfillPhase({
    phase: "convention_id",
    maxBatchesPerPhase,
    updateNextBatch: () => fillConventionIdBatch(kysely, batchSize),
  });

  const agencyIdPhase = await runBackfillPhase({
    phase: "agency_id",
    maxBatchesPerPhase,
    updateNextBatch: () => fillAgencyIdBatch(kysely, batchSize),
  });

  const summary = {
    totalConventionIdUpdated: conventionIdPhase.totalUpdated,
    totalAgencyIdUpdated: agencyIdPhase.totalUpdated,
    remainingOrphanAgencyIds: await countRemainingOrphanAgencyIds(kysely),
    invalidLegacyConventionIds: await countInvalidLegacyConventionIds(kysely),
    conventionIdStoppedByMaxBatches: conventionIdPhase.stoppedByMaxBatches,
    agencyIdStoppedByMaxBatches: agencyIdPhase.stoppedByMaxBatches,
  };

  return summary;
};

const runScript = async () => {
  const pool = createMakeScriptPgPool(config)();
  const kysely = makeKyselyDb(pool);
  try {
    return await backfillBroadcastFeedbackIds(kysely);
  } finally {
    await pool.end();
  }
};

if (require.main === module) {
  handleCRONScript({
    name: "backfillBroadcastFeedbackIds",
    config,
    script: runScript,
    handleResults: ({
      totalConventionIdUpdated,
      totalAgencyIdUpdated,
      remainingOrphanAgencyIds,
      invalidLegacyConventionIds,
      conventionIdStoppedByMaxBatches,
      agencyIdStoppedByMaxBatches,
    }) =>
      [
        `convention_id filled: ${totalConventionIdUpdated}`,
        `agency_id filled: ${totalAgencyIdUpdated}`,
        `remaining orphan agency_id (rows with convention_id but no matching convention): ${remainingOrphanAgencyIds}`,
        `invalid legacy convention_id rows skipped: ${invalidLegacyConventionIds}`,
        `convention_id phase stopped by max batches: ${conventionIdStoppedByMaxBatches}`,
        `agency_id phase stopped by max batches: ${agencyIdStoppedByMaxBatches}`,
      ].join("\n"),
    logger,
  });
}
