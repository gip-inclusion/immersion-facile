import { Kysely } from "kysely";
import { keys } from "ramda";
import { FeatureFlags, hasFeatureFlagValue, SetFeatureFlagParam } from "shared";
import { FeatureFlagRepository } from "../../../domain/core/ports/FeatureFlagRepository";
import { executeKyselyRawSqlQuery, ImmersionDatabase } from "./sql/database";

export class PgFeatureFlagRepository implements FeatureFlagRepository {
  constructor(private transaction: Kysely<ImmersionDatabase>) {}

  async getAll(): Promise<FeatureFlags> {
    const query = `
        SELECT *
        FROM feature_flags
    `;
    const result = await executeKyselyRawSqlQuery(this.transaction, query);
    return rawPgToFeatureFlags(result.rows);
  }

  async insert(featureFlags: FeatureFlags): Promise<void> {
    await Promise.all(
      keys(featureFlags).map(async (flagName) => {
        const flag = featureFlags[flagName];
        await executeKyselyRawSqlQuery(
          this.transaction,
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

  async update(params: SetFeatureFlagParam): Promise<void> {
    const query = `
        UPDATE feature_flags
        SET is_active = $1,
            value     = $2
        WHERE flag_name = $3
    `;
    await executeKyselyRawSqlQuery(this.transaction, query, [
      params.flagContent.isActive,
      hasFeatureFlagValue(params.flagContent)
        ? JSON.stringify(params.flagContent.value)
        : null,
      params.flagName,
    ]);
  }
}

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
