import { Pool, PoolClient } from "pg";
import { keys } from "ramda";
import {
  expectToEqual,
  FeatureFlags,
  FeatureFlagText,
  hasFeatureFlagValue,
  makeBooleanFeatureFlag,
  makeTextFeatureFlag,
} from "shared";
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
      enableInseeApi: makeBooleanFeatureFlag(true),
      enablePeConnectApi: makeBooleanFeatureFlag(true),
      enableLogoUpload: makeBooleanFeatureFlag(false),
      enablePeConventionBroadcast: makeBooleanFeatureFlag(true),
      enableTemporaryOperation: makeBooleanFeatureFlag(false),
      enableMaxContactPerWeek: makeBooleanFeatureFlag(false),
      enableMaintenance: makeTextFeatureFlag(false, {
        message: "Maintenance message",
      }),
    };

    await insertFeatureFlagsInTable(expectedFeatureFlags);

    const featureFlags = await featureFlagRepository.getAll();

    expectToEqual(featureFlags, {
      enableInseeApi: makeBooleanFeatureFlag(true),
      enablePeConnectApi: makeBooleanFeatureFlag(true),
      enableLogoUpload: makeBooleanFeatureFlag(false),
      enablePeConventionBroadcast: makeBooleanFeatureFlag(true),
      enableTemporaryOperation: makeBooleanFeatureFlag(false),
      enableMaxContactPerWeek: makeBooleanFeatureFlag(false),
      enableMaintenance: makeTextFeatureFlag(false, {
        message: "Maintenance message",
      }),
    });
  });

  it("sets a Feature Flag to the given value", async () => {
    const initialFeatureFlags: FeatureFlags = {
      enableInseeApi: makeBooleanFeatureFlag(true),
      enablePeConnectApi: makeBooleanFeatureFlag(true),
      enablePeConventionBroadcast: makeBooleanFeatureFlag(true),
      enableLogoUpload: makeBooleanFeatureFlag(false),
      enableTemporaryOperation: makeBooleanFeatureFlag(false),
      enableMaxContactPerWeek: makeBooleanFeatureFlag(false),
      enableMaintenance: makeTextFeatureFlag(false, {
        message: "Maintenance message",
      }),
    };

    await insertFeatureFlagsInTable(initialFeatureFlags);

    await featureFlagRepository.set({
      flagName: "enableLogoUpload",
      flagContent: {
        isActive: true,
      },
    });

    const featureFlags = await featureFlagRepository.getAll();
    expectToEqual(featureFlags, {
      enableInseeApi: makeBooleanFeatureFlag(true),
      enablePeConnectApi: makeBooleanFeatureFlag(true),
      enablePeConventionBroadcast: makeBooleanFeatureFlag(true),
      enableLogoUpload: makeBooleanFeatureFlag(true),
      enableTemporaryOperation: makeBooleanFeatureFlag(false),
      enableMaxContactPerWeek: makeBooleanFeatureFlag(false),
      enableMaintenance: makeTextFeatureFlag(false, {
        message: "Maintenance message",
      }),
    });
  });

  const insertFeatureFlagsInTable = async (flags: FeatureFlags) => {
    await Promise.all(
      keys(flags).map((flagName) => {
        const isFlagActive = flags[flagName].isActive;
        const flagKind = flags[flagName].kind;
        const flagValue = hasFeatureFlagValue(flags[flagName])
          ? (flags[flagName] as FeatureFlagText).value
          : null;

        return client.query(
          `INSERT INTO feature_flags (flag_name, is_active, kind, value) VALUES ('${flagName}', ${isFlagActive}, '${flagKind}', ${
            flagValue ? `'${JSON.stringify(flagValue)}'` : "NULL"
          });`,
        );
      }),
    );
  };
});
