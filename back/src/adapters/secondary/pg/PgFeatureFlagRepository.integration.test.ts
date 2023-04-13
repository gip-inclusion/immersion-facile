import { Pool, PoolClient } from "pg";
import { keys } from "ramda";
import { expectTypeToMatchAndEqual, FeatureFlags } from "shared";
import { getTestPgPool } from "../../../_testBuilders/getTestPgPool";
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
      enablePeConnectApi: true,
      enableLogoUpload: false,
      enablePeConventionBroadcast: true,
      enableTemporaryOperation: false,
      enableMaxContactPerWeek: false,
    };

    await insertFeatureFlagsInTable(expectedFeatureFlags);

    const featureFlags = await featureFlagRepository.getAll();

    expectTypeToMatchAndEqual(featureFlags, {
      enableInseeApi: true,
      enablePeConnectApi: true,
      enableLogoUpload: false,
      enablePeConventionBroadcast: true,
      enableTemporaryOperation: false,
      enableMaxContactPerWeek: false,
    });
  });

  it("sets a Feature Flag to the given value", async () => {
    const initialFeatureFlags: FeatureFlags = {
      enableInseeApi: true,
      enablePeConnectApi: true,
      enablePeConventionBroadcast: true,
      enableLogoUpload: false,
      enableTemporaryOperation: false,
      enableMaxContactPerWeek: false,
    };

    await insertFeatureFlagsInTable(initialFeatureFlags);

    await featureFlagRepository.set({
      flagName: "enableLogoUpload",
      value: true,
    });

    const featureFlags = await featureFlagRepository.getAll();

    expectTypeToMatchAndEqual(featureFlags, {
      enableInseeApi: true,
      enablePeConnectApi: true,
      enablePeConventionBroadcast: true,
      enableLogoUpload: true,
      enableTemporaryOperation: false,
      enableMaxContactPerWeek: false,
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
