import { PoolClient } from "pg";
import { keys } from "ramda";
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

  async update(params: SetFeatureFlagParam): Promise<void> {
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

  async insert(featureFlags: FeatureFlags): Promise<void> {
    await Promise.all(
      keys(featureFlags).map(async (flagName) => {
        const flag = featureFlags[flagName];
        await this.client.query(
          "INSERT INTO feature_flags (flag_name, is_active, kind, value) VALUES ($1, $2, $3, $4)",
          [
            flagName,
            flag.isActive,
            flag.kind,
            hasFeatureFlagValue(flag) ? JSON.stringify(flag.value) : null,
          ],
        );
      }),
    );
  }
}
