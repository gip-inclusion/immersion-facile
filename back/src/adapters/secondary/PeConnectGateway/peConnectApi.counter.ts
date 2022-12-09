import promClient from "prom-client";

type CounterType =
  | "getUserStatutInfo"
  | "getAdvisorsInfo"
  | "getUserInfo"
  | "exchangeCodeForAccessToken";

const makeCounters = (counterType: CounterType) => ({
  success: new promClient.Counter({
    name: `peConnect_${counterType}_success`,
    help: `The number of ${counterType} success`,
  }),
  total: new promClient.Counter({
    name: `peConnect_${counterType}_total`,
    help: `The number of ${counterType} total`,
  }),
  error: new promClient.Counter<"errorType">({
    name: `peConnect_${counterType}_error`,
    help: `The number of ${counterType} errors, broken down by error type`,
    labelNames: ["errorType"],
  }),
});

export const getUserStatutInfoCounter = makeCounters("getUserStatutInfo");
export const getAdvisorsInfoCounter = makeCounters("getAdvisorsInfo");
export const getUserInfoCounter = makeCounters("getUserInfo");
export const exchangeCodeForAccessTokenCounter = makeCounters(
  "exchangeCodeForAccessToken",
);
