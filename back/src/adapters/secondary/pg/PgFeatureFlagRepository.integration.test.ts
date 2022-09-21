import { Pool, PoolClient } from "pg";
import { keys } from "ramda";
import { FeatureFlags } from "shared/src/featureFlags";
import { getTestPgPool } from "../../../_testBuilders/getTestPgPool";
import { expectTypeToMatchAndEqual } from "../../../_testBuilders/test.helpers";
import { FeatureFlagRepository } from "../../../domain/core/ports/FeatureFlagRepository";
import { PgFeatureFlagRepository } from "./PgFeatureFlagRepository";

describe("PG getFeatureFlags", () => {
  let pool: Pool;
  let client: PoolClient;
  let featureFlagRepository: FeatureFlagRepository;

  beforeEach(async () => {
    pool = getTestPgPool();
    client = await pool.connect();
    await client.query("DELETE FROM feature_flags");
    featureFlagRepository = new PgFeatureFlagRepository(client);
  });

  afterEach(async () => {
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

    const featureFlags = await featureFlagRepository.getAll();

    expectTypeToMatchAndEqual(featureFlags, {
      enableInseeApi: true,
      enableAdminUi: true,
      enablePeConnectApi: true,
      enableLogoUpload: false,
      enablePeConventionBroadcast: true,
    });
  });

  it("sets a Feature Flag to the given value", async () => {
    const initialFeatureFlags: FeatureFlags = {
      enableInseeApi: true,
      enableAdminUi: true,
      enablePeConnectApi: true,
      enablePeConventionBroadcast: true,
      enableLogoUpload: false,
    };

    await insertFeatureFlagsInTable(initialFeatureFlags);

    await featureFlagRepository.set({
      flagName: "enableLogoUpload",
      value: true,
    });

    const featureFlags = await featureFlagRepository.getAll();

    expectTypeToMatchAndEqual(featureFlags, {
      enableInseeApi: true,
      enableAdminUi: true,
      enablePeConnectApi: true,
      enablePeConventionBroadcast: true,
      enableLogoUpload: true,
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
