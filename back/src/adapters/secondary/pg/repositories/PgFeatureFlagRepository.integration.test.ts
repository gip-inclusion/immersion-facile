import { Pool, PoolClient } from "pg";
import {
  FeatureFlags,
  expectToEqual,
  makeTextFeatureFlag,
  makeTextImageAndRedirectFeatureFlag,
} from "shared";
import { FeatureFlagRepository } from "../../../../domains/core/ports/FeatureFlagRepository";
import { makeKyselyDb } from "../kysely/kyselyUtils";
import { getTestPgPool } from "../pgUtils";
import { PgFeatureFlagRepository } from "./PgFeatureFlagRepository";

describe("PG getFeatureFlags", () => {
  let pool: Pool;
  let client: PoolClient;
  let featureFlagRepository: FeatureFlagRepository;

  beforeEach(async () => {
    pool = getTestPgPool();
    client = await pool.connect();
    await client.query("DELETE FROM feature_flags");
    featureFlagRepository = new PgFeatureFlagRepository(makeKyselyDb(pool));
  });

  afterEach(async () => {
    client.release();
    await pool.end();
  });

  it("gets all the Feature Flags of the app", async () => {
    const expectedFeatureFlags: FeatureFlags = {
      enableTemporaryOperation: makeTextImageAndRedirectFeatureFlag(false, {
        imageAlt: "Alt",
        imageUrl: "http://image",
        message: "message",
        redirectUrl: "http://redirect",
        overtitle: "",
        title: "",
      }),
      enableMaintenance: makeTextFeatureFlag(false, {
        message: "Maintenance message",
      }),
    };

    await featureFlagRepository.insertAll(expectedFeatureFlags);

    const featureFlags = await featureFlagRepository.getAll();

    expectToEqual(featureFlags, {
      enableTemporaryOperation: makeTextImageAndRedirectFeatureFlag(false, {
        imageAlt: "Alt",
        imageUrl: "http://image",
        message: "message",
        redirectUrl: "http://redirect",
        overtitle: "",
        title: "",
      }),
      enableMaintenance: makeTextFeatureFlag(false, {
        message: "Maintenance message",
      }),
    });
  });

  it("inserts featureFlags than updates a Feature Flag to the given value", async () => {
    const initialFeatureFlags: FeatureFlags = {
      enableTemporaryOperation: makeTextImageAndRedirectFeatureFlag(false, {
        imageAlt: "Alt",
        imageUrl: "http://image",
        message: "message",
        redirectUrl: "http://redirect",
        overtitle: "overtitle",
        title: "title",
      }),
      enableMaintenance: makeTextFeatureFlag(false, {
        message: "Maintenance message",
      }),
    };

    await featureFlagRepository.insertAll(initialFeatureFlags);

    const featureFlagsInitiallyInserted = await featureFlagRepository.getAll();
    expectToEqual(initialFeatureFlags, featureFlagsInitiallyInserted);

    await featureFlagRepository.update({
      flagName: "enableTemporaryOperation",
      featureFlag: makeTextImageAndRedirectFeatureFlag(true, {
        imageAlt: "updatedAlt",
        imageUrl: "http://updatedImage",
        message: "updatedMessage",
        redirectUrl: "http://updatedRedirect",
        overtitle: "updatedOvertitle",
        title: "updatedTitle",
      }),
    });

    const featureFlags = await featureFlagRepository.getAll();
    expectToEqual(featureFlags, {
      enableTemporaryOperation: makeTextImageAndRedirectFeatureFlag(true, {
        imageAlt: "updatedAlt",
        imageUrl: "http://updatedImage",
        message: "updatedMessage",
        redirectUrl: "http://updatedRedirect",
        overtitle: "updatedOvertitle",
        title: "updatedTitle",
      }),
      enableMaintenance: makeTextFeatureFlag(false, {
        message: "Maintenance message",
      }),
    });
  });
});
