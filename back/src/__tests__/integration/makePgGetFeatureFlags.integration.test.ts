import { Pool, PoolClient } from "pg";
import { keys } from "ramda";
import { FeatureFlags } from "shared/src/featureFlags";
import { getTestPgPool } from "../../_testBuilders/getTestPgPool";
import { expectTypeToMatchAndEqual } from "../../_testBuilders/test.helpers";
import { makePgGetFeatureFlags } from "../../adapters/secondary/pg/makePgGetFeatureFlags";
import { GetFeatureFlags } from "../../domain/core/ports/GetFeatureFlags";

describe("PG getFeatureFlags", () => {
  let pool: Pool;
  let client: PoolClient;
  let getFeatureFlags: GetFeatureFlags;

  beforeAll(async () => {
    pool = getTestPgPool();
    client = await pool.connect();
    await client.query("DELETE FROM feature_flags");
    getFeatureFlags = makePgGetFeatureFlags(client);
  });

  afterAll(async () => {
    client.release();
    await pool.end();
  });

  it("gets all the Feature Flags of the app", async () => {
    const expectedFeatureFlags: FeatureFlags = {
      enableInseeApi: true,
      enableAdminUi: true,
      enablePeConnectApi: true,
      enableLogoUpload: false,
      enablePeConventionBroadcast: true,
    };

    await insertFeatureFlagsInTable(expectedFeatureFlags);

    const featureFlags = await getFeatureFlags();

    expectTypeToMatchAndEqual(featureFlags, {
      enableInseeApi: true,
      enableAdminUi: true,
      enablePeConnectApi: true,
      enableLogoUpload: false,
      enablePeConventionBroadcast: true,
    });
  });

  const insertFeatureFlagsInTable = async (flags: FeatureFlags) => {
    await Promise.all(
      keys(flags).map((flagName) => {
        const isFlagActive = flags[flagName];
        return client.query(
          `INSERT INTO feature_flags (flag_name, is_active) VALUES ('${flagName}', ${isFlagActive});`,
        );
      }),
    );
  };
});
