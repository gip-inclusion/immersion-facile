import { PoolClient } from "pg";
import { FeatureFlags, hasFeatureFlagValue, SetFeatureFlagParam } from "shared";
import { FeatureFlagRepository } from "../../../domain/core/ports/FeatureFlagRepository";

const rawPgToFeatureFlags = (raw: any[]): FeatureFlags =>
  raw.reduce(
    (acc, row) => ({
      ...acc,
      [row.flag_name]: {
        isActive: row.is_active,
        kind: row.kind,
        ...(row.kind === "text" && { value: row.value }),
      },
    }),
    {} as FeatureFlags,
  );

export class PgFeatureFlagRepository implements FeatureFlagRepository {
  constructor(private client: PoolClient) {}

  async getAll(): Promise<FeatureFlags> {
    const result = await this.client.query("SELECT * FROM feature_flags");
    return rawPgToFeatureFlags(result.rows);
  }

  async set(params: SetFeatureFlagParam): Promise<void> {
    await this.client.query(
      "UPDATE feature_flags SET is_active = $1, value = $2 WHERE flag_name = $3",
      [
        params.flagContent.isActive,
        hasFeatureFlagValue(params.flagContent)
          ? JSON.stringify(params.flagContent.value)
          : null,
        params.flagName,
      ],
    );
  }
}
