import { FeatureFlags } from "shared";
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
  enableInseeApi: true,
  enablePeConnectApi: true,
  enableLogoUpload: true,
  enablePeConventionBroadcast: true,
  enableTemporaryOperation: false,
};

export const makeStubFeatureFlags = (
  flags: Partial<FeatureFlags> = {},
): FeatureFlags => ({ ...defaultFlagsInFront, ...flags });
