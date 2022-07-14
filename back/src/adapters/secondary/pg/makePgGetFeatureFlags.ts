import { PoolClient } from "pg";
import { FeatureFlags } from "shared/src/featureFlags";
import { GetFeatureFlags } from "../../../domain/core/ports/GetFeatureFlags";

const rawPgToFeatureFlags = (raw: any[]): FeatureFlags =>
  raw.reduce(
    (acc, row) => ({
      ...acc,
      [row.flag_name]: row.is_active,
    }),
    {} as FeatureFlags,
  );

export const makePgGetFeatureFlags =
  (client: PoolClient): GetFeatureFlags =>
  async () => {
    const result = await client.query("SELECT * FROM feature_flags");
    return rawPgToFeatureFlags(result.rows);
  };
