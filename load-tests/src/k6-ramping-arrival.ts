import { check } from "k6";
import http from "k6/http";
import type { Options } from "k6/options";

const trimTrailingSlashes = (value: string) => value.replace(/\/+$/, "");
const trimLeadingSlashes = (value: string) => value.replace(/^\/+/g, "");

const getValueFromEnv = (name: string): string => {
  const value = __ENV[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
};

const getPositiveIntegerFromEnv = (name: string): number => {
  const value = getValueFromEnv(name);
  const parsedValue = Number.parseInt(value, 10);

  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    throw new Error(`${name} must be greater than 0`);
  }

  return parsedValue;
};

const baseUrl = getValueFromEnv("BASE_URL");
const endpointPath = getValueFromEnv("ENDPOINT_PATH");
const targetUrl = `${trimTrailingSlashes(baseUrl)}/${trimLeadingSlashes(endpointPath)}`;
const targetRps = getPositiveIntegerFromEnv("TARGET_RPS");
const preAllocatedVUs = getPositiveIntegerFromEnv("PRE_ALLOCATED_VUS");
const maxVUs = getPositiveIntegerFromEnv("MAX_VUS");

export const options: Options = {
  scenarios: {
    rampingEndpoint: {
      executor: "ramping-arrival-rate",
      startRate: 1,
      timeUnit: "1s",
      preAllocatedVUs,
      maxVUs,
      stages: [
        { duration: "15s", target: Math.round(targetRps * 0.1) }, //10 RPS => 150
        { duration: "30s", target: Math.round(targetRps * 0.25) }, //25 RPS => 750
        { duration: "30s", target: Math.round(targetRps * 0.5) }, // 50 RPS => 1500
        { duration: "1m", target: targetRps }, // 100 RPS => 6000
        { duration: "15s", target: 0 },
      ],
    },
  },
  thresholds: {
    checks: ["rate>0.99"],
    dropped_iterations: ["count==0"],
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<500", "p(99)<1000"],
  },
};

export default function () {
  const response = http.get(targetUrl, {
    tags: { name: endpointPath },
  });

  check(response, {
    "status is 200": () => response.status === 200,
  });
}
