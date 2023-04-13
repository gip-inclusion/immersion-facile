import { PoolClient } from "pg";

import { FeatureFlag, FeatureFlags } from "shared";

import { FeatureFlagRepository } from "../../../domain/core/ports/FeatureFlagRepository";

const rawPgToFeatureFlags = (raw: any[]): FeatureFlags =>
  raw.reduce(
    (acc, row) => ({
      ...acc,
      [row.flag_name]: row.is_active,
    }),
    {} as FeatureFlags,
  );

export class PgFeatureFlagRepository implements FeatureFlagRepository {
  constructor(private client: PoolClient) {}

  async getAll(): Promise<FeatureFlags> {
    const result = await this.client.query("SELECT * FROM feature_flags");
    return rawPgToFeatureFlags(result.rows);
  }

  async set(params: { flagName: FeatureFlag; value: boolean }): Promise<void> {
    await this.client.query(
      "UPDATE feature_flags SET is_active = $1 WHERE flag_name = $2",
      [params.value, params.flagName],
    );
  }
}
