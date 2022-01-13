import { check, sleep } from "k6";
import { ImmersionFacileApi } from "./ImmersionFacileApi";
import { RandomDataGenerator } from "./RandomDataGenerator";
import { getOptionsForScenario } from "./scenarios";

const getEnvVarOrDie = (name: string): string => {
  const value = __ENV[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
};

export const options = getOptionsForScenario(getEnvVarOrDie("TEST_SCENARIO"));

type VUConfig = {
  testHost: string;
  randomSeed: string;
};

export const setup = (): VUConfig => {
  const vuConfig: VUConfig = {
    testHost: getEnvVarOrDie("TEST_HOST"),
    randomSeed: __ENV.RANDOM_SEED || Date.now().toString(),
  };
  console.log(`vuConfig: ${JSON.stringify(vuConfig, null, " ")}`);
  return vuConfig;
};

export default ({ randomSeed, testHost }: VUConfig) => {
  const dataGenerator = new RandomDataGenerator(
    `${randomSeed}_${__VU}_${__ITER}`,
  );
  const immersionFacileApi = new ImmersionFacileApi(testHost);

  const req = dataGenerator.getSearchImmersionRequest();
  const res = immersionFacileApi.searchImmersion(req);

  check(res, {
    "http status 200": (r) => r.status == 200,
  });

  sleep(1);
};
