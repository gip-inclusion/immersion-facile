import { keys } from "ramda";
import { FeatureFlags, SetFeatureFlagParam, hasFeatureFlagValue } from "shared";
import { KyselyDb } from "../../../../config/pg/kysely/kyselyUtils";
import { FeatureFlagRepository } from "../ports/FeatureFlagRepository";

const rawPgToFeatureFlags = (raw: any[]): FeatureFlags =>
  raw.reduce(
    (acc, row) => ({
      ...acc,
      [row.flag_name]: {
        isActive: row.is_active,
        kind: row.kind,
        ...((row.kind === "text" || row.kind === "textImageAndRedirect") && {
          value: row.value,
        }),
      },
    }),
    {} as FeatureFlags,
  );

export class PgFeatureFlagRepository implements FeatureFlagRepository {
  constructor(private transaction: KyselyDb) {}

  public async getAll(): Promise<FeatureFlags> {
    const result = await this.transaction
      .selectFrom("feature_flags")
      .selectAll()
      .execute();

    return rawPgToFeatureFlags(result);
  }

  public async insertAll(featureFlags: FeatureFlags): Promise<void> {
    await this.transaction
      .insertInto("feature_flags")
      .values(
        keys(featureFlags).map((flagName) => {
          const flag = featureFlags[flagName];
          return {
            flag_name: flagName,
            is_active: flag.isActive,
            kind: flag.kind,
            value: hasFeatureFlagValue(flag)
              ? JSON.stringify(flag.value)
              : null,
          };
        }),
      )
      .execute();
  }

  public async update(params: SetFeatureFlagParam): Promise<void> {
    await this.transaction
      .updateTable("feature_flags")
      .set({
        is_active: params.featureFlag.isActive,
        value: hasFeatureFlagValue(params.featureFlag)
          ? JSON.stringify(params.featureFlag.value)
          : null,
      })
      .where("flag_name", "=", params.flagName)
      .execute();
  }
}
