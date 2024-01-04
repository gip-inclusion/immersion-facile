import { keys } from "ramda";
import {
  FeatureFlags,
  makeBooleanFeatureFlag,
  makeTextFeatureFlag,
  SetFeatureFlagParam,
} from "shared";
import { FeatureFlagRepository } from "../../domain/core/ports/FeatureFlagRepository";

const defaultFlags: FeatureFlags = {
  enableInseeApi: makeBooleanFeatureFlag(true),
  enablePeConnectApi: makeBooleanFeatureFlag(true),
  enableLogoUpload: makeBooleanFeatureFlag(true),
  enablePeConventionBroadcast: makeBooleanFeatureFlag(true),
  enableTemporaryOperation: makeBooleanFeatureFlag(false),
  enableMaxContactPerWeek: makeBooleanFeatureFlag(false),
  enableMaintenance: makeTextFeatureFlag(false, {
    message: "Maintenance message",
  }),
};

export class InMemoryFeatureFlagRepository implements FeatureFlagRepository {
  readonly #featureFlags: FeatureFlags;

  constructor(featureFlags: Partial<FeatureFlags> = {}) {
    this.#featureFlags = { ...defaultFlags, ...featureFlags };
  }

  public async getAll(): Promise<FeatureFlags> {
    return this.#featureFlags;
  }

  public async insert(flags: FeatureFlags): Promise<void> {
    keys(flags).forEach((flagName) => {
      this.#featureFlags[flagName] = flags[flagName];
    });
  }

  public async update(params: SetFeatureFlagParam): Promise<void> {
    this.#featureFlags[params.flagName] = {
      ...this.#featureFlags[params.flagName],
      ...(params.flagContent as any),
    };
  }
}
