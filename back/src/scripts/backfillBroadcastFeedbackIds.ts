import "./instrumentSentryCron";
import { type SqlBool, sql } from "kysely";
import { AppConfig } from "../config/bootstrap/appConfig";
import { type KyselyDb, makeKyselyDb } from "../config/pg/kysely/kyselyUtils";
import { createMakeScriptPgPool } from "../config/pg/pgPool";
import { createLogger } from "../utils/logger";
import { handleCRONScript } from "./handleCRONScript";

const logger = createLogger(__filename);
const config = AppConfig.createFromEnv();

const batchSize = 10_000;

const parseMaxBatchesPerPhase = (raw: string | undefined): number => {
  if (!raw) return Number.POSITIVE_INFINITY;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0)
    throw new Error(
      `Invalid BACKFILL_MAX_BATCHES_PER_PHASE=${raw} (expected a positive integer)`,
    );
  return parsed;
};

const maxBatchesPerPhase = parseMaxBatchesPerPhase(
  process.env.BACKFILL_MAX_BATCHES_PER_PHASE,
);

const fillConventionIdBatch = async (kysely: KyselyDb): Promise<number> => {
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
        ORDER BY id
        LIMIT ${batchSize}
      ))`,
    )
    .executeTakeFirst();
  return Number(res.numUpdatedRows);
};

const fillAgencyIdBatch = async (kysely: KyselyDb): Promise<number> => {
  const res = await kysely
    .updateTable("broadcast_feedbacks")
    .from("conventions")
    .set((eb) => ({ agency_id: eb.ref("conventions.agency_id") }))
    .whereRef("broadcast_feedbacks.convention_id", "=", "conventions.id")
    .where(
      sql<SqlBool>`broadcast_feedbacks.id = ANY(ARRAY(
        SELECT id
        FROM broadcast_feedbacks
        WHERE agency_id IS NULL
          AND convention_id IS NOT NULL
        ORDER BY id
        LIMIT ${batchSize}
      ))`,
    )
    .executeTakeFirst();
  return Number(res.numUpdatedRows);
};

const countRemainingOrphanAgencyIds = async (
  kysely: KyselyDb,
): Promise<number> => {
  const row = await kysely
    .selectFrom("broadcast_feedbacks")
    .select((eb) => eb.fn.countAll<string>().as("count"))
    .where("agency_id", "is", null)
    .where("convention_id", "is not", null)
    .executeTakeFirstOrThrow();
  return Number(row.count);
};

export const backfillBroadcastFeedbackIds = async (kysely: KyselyDb) => {
  let totalConventionIdUpdated = 0;
  let conventionIdBatches = 0;
  for (;;) {
    const n = await fillConventionIdBatch(kysely);
    totalConventionIdUpdated += n;
    conventionIdBatches += 1;
    logger.info({
      message: JSON.stringify({
        phase: "convention_id",
        batchRows: n,
        totalSoFar: totalConventionIdUpdated,
      }),
    });
    if (n === 0) break;
    if (conventionIdBatches >= maxBatchesPerPhase) break;
  }

  let totalAgencyIdUpdated = 0;
  let agencyIdBatches = 0;
  for (;;) {
    const n = await fillAgencyIdBatch(kysely);
    totalAgencyIdUpdated += n;
    agencyIdBatches += 1;
    logger.info({
      message: JSON.stringify({
        phase: "agency_id",
        batchRows: n,
        totalSoFar: totalAgencyIdUpdated,
      }),
    });
    if (n === 0) break;
    if (agencyIdBatches >= maxBatchesPerPhase) break;
  }

  const remainingOrphanAgencyIds = await countRemainingOrphanAgencyIds(kysely);
  logger.info({
    message: JSON.stringify({
      phase: "summary",
      remainingOrphanAgencyIds,
    }),
  });

  return {
    totalConventionIdUpdated,
    totalAgencyIdUpdated,
    remainingOrphanAgencyIds,
  };
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
    }) =>
      [
        `convention_id filled: ${totalConventionIdUpdated}`,
        `agency_id filled: ${totalAgencyIdUpdated}`,
        `remaining orphan agency_id (rows with convention_id but no matching convention): ${remainingOrphanAgencyIds}`,
      ].join("\n"),
    logger,
  });
}
