import type { FeatureFlagKind, FeatureFlags } from "shared";
import type { KyselyDb } from "../../../../config/pg/kysely/kyselyUtils";
import type { FeatureFlagQueries } from "../ports/FeatureFlagQueries";

export class PgFeatureFlagQueries implements FeatureFlagQueries {
  constructor(private transaction: KyselyDb) {}

  public async getAll(): Promise<FeatureFlags> {
    const result = await this.transaction
      .selectFrom("feature_flags")
      .selectAll()
      .execute();

    return rawPgToFeatureFlags(result);
  }
}

const rawPgToFeatureFlags = (raw: any[]): FeatureFlags => {
  const flagKindsNeedingValue: Extract<
    FeatureFlagKind,
    "textWithSeverity" | "textImageAndRedirect" | "highlight"
  >[] = ["textWithSeverity", "textImageAndRedirect", "highlight"];
  return raw.reduce(
    (acc, row) => ({
      ...acc,
      [row.flag_name]: {
        isActive: row.is_active,
        kind: row.kind,
        ...(flagKindsNeedingValue.includes(row.kind) && {
          value: row.value,
        }),
      },
    }),
    {} as FeatureFlags,
  );
};
