import {
  FeatureFlags,
  makeBooleanFeatureFlag,
  makeTextFeatureFlag,
} from "shared";
import { StoreAndDeps } from "src/core-logic/storeConfig/createTestStore";

type ScenarioUnitTest = (storeAndDeps: StoreAndDeps) => void;

export const createScenarioUnitTest = <T>(f: (param: T) => ScenarioUnitTest) =>
  f;

export const triggerTests = (
  storeAndDeps: StoreAndDeps,
  unitTests: ScenarioUnitTest[],
) => {
  unitTests.forEach((unitTest) => unitTest(storeAndDeps));
};

export const fastForwardObservables = createScenarioUnitTest<string>(
  (description = "") =>
    ({ dependencies }) => {
      // eslint-disable-next-line jest/expect-expect
      it(`${description || "fast forward time related observables"}`, () => {
        dependencies.scheduler.flush();
      });
    },
);

const defaultFlagsInFront: FeatureFlags = {
  enableInseeApi: makeBooleanFeatureFlag(true),
  enablePeConnectApi: makeBooleanFeatureFlag(true),
  enableLogoUpload: makeBooleanFeatureFlag(true),
  enablePeConventionBroadcast: makeBooleanFeatureFlag(true),
  enableTemporaryOperation: makeBooleanFeatureFlag(false),
  enableMaxContactPerWeek: makeBooleanFeatureFlag(false),
  enableMaintenance: makeTextFeatureFlag(false, {
    message: "My maintenance message",
  }),
};

export const makeStubFeatureFlags = (
  flags: Partial<FeatureFlags> = {},
): FeatureFlags => ({ ...defaultFlagsInFront, ...flags });
