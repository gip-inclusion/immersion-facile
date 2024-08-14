import { Pool } from "pg";
import {
  FeatureFlags,
  expectToEqual,
  makeBooleanFeatureFlag,
  makeTextImageAndRedirectFeatureFlag,
  makeTextWithSeverityFeatureFlag,
} from "shared";
import {
  KyselyDb,
  makeKyselyDb,
} from "../../../../config/pg/kysely/kyselyUtils";
import { getTestPgPool } from "../../../../config/pg/pgUtils";
import { FeatureFlagRepository } from "../ports/FeatureFlagRepository";
import { PgFeatureFlagRepository } from "./PgFeatureFlagRepository";

describe("PG getFeatureFlags", () => {
  let pool: Pool;
  let db: KyselyDb;
  let featureFlagRepository: FeatureFlagRepository;

  beforeAll(async () => {
    pool = getTestPgPool();
    db = makeKyselyDb(pool);
    featureFlagRepository = new PgFeatureFlagRepository(db);
  });

  beforeEach(async () => {
    await db.deleteFrom("feature_flags").execute();
  });

  afterAll(async () => {
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
      enableMaintenance: makeTextWithSeverityFeatureFlag(false, {
        message: "Maintenance message",
        severity: "warning",
      }),
      enableSearchByScore: makeBooleanFeatureFlag(false),
      enableProConnect: makeBooleanFeatureFlag(false),
    };

    await featureFlagRepository.insertAll(expectedFeatureFlags);

    expectToEqual(await featureFlagRepository.getAll(), {
      enableTemporaryOperation: makeTextImageAndRedirectFeatureFlag(false, {
        imageAlt: "Alt",
        imageUrl: "http://image",
        message: "message",
        redirectUrl: "http://redirect",
        overtitle: "",
        title: "",
      }),
      enableMaintenance: makeTextWithSeverityFeatureFlag(false, {
        message: "Maintenance message",
        severity: "warning",
      }),
      enableSearchByScore: makeBooleanFeatureFlag(false),
      enableProConnect: makeBooleanFeatureFlag(false),
    });
  });

  it("inserts featureFlags then updates a Feature Flag to the given value", async () => {
    const initialFeatureFlags: FeatureFlags = {
      enableTemporaryOperation: makeTextImageAndRedirectFeatureFlag(false, {
        imageAlt: "Alt",
        imageUrl: "http://image",
        message: "message",
        redirectUrl: "http://redirect",
        overtitle: "overtitle",
        title: "title",
      }),
      enableMaintenance: makeTextWithSeverityFeatureFlag(false, {
        message: "Maintenance message",
        severity: "error",
      }),
      enableSearchByScore: makeBooleanFeatureFlag(false),
      enableProConnect: makeBooleanFeatureFlag(false),
    };

    await featureFlagRepository.insertAll(initialFeatureFlags);

    expectToEqual(await featureFlagRepository.getAll(), initialFeatureFlags);

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

    await featureFlagRepository.update({
      flagName: "enableSearchByScore",
      featureFlag: makeBooleanFeatureFlag(true),
    });

    expectToEqual(await featureFlagRepository.getAll(), {
      enableTemporaryOperation: makeTextImageAndRedirectFeatureFlag(true, {
        imageAlt: "updatedAlt",
        imageUrl: "http://updatedImage",
        message: "updatedMessage",
        redirectUrl: "http://updatedRedirect",
        overtitle: "updatedOvertitle",
        title: "updatedTitle",
      }),
      enableMaintenance: makeTextWithSeverityFeatureFlag(false, {
        message: "Maintenance message",
        severity: "error",
      }),
      enableSearchByScore: makeBooleanFeatureFlag(true),
      enableProConnect: makeBooleanFeatureFlag(false),
    });
  });
});
