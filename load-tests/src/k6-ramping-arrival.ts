import { check } from "k6";
import http from "k6/http";
import type { Options } from "k6/options";

const trimTrailingSlashes = (value: string) => value.replace(/\/+$/, "");
const trimLeadingSlashes = (value: string) => value.replace(/^\/+/g, "");

const getPositiveIntegerFromEnv = (name: string, fallback: number) => {
  const value = __ENV[name];
  if (!value) return fallback;

  const parsedValue = Number.parseInt(value, 10);
  return Number.isFinite(parsedValue) && parsedValue > 0
    ? parsedValue
    : fallback;
};

const baseUrl = __ENV.BASE_URL ?? "http://localhost:1234";
const endpointPath = __ENV.ENDPOINT_PATH ?? "/feature-flags";
const targetUrl = `${trimTrailingSlashes(baseUrl)}/${trimLeadingSlashes(endpointPath)}`;
const targetRps = getPositiveIntegerFromEnv("TARGET_RPS", 10);
const preAllocatedVUs = getPositiveIntegerFromEnv("PRE_ALLOCATED_VUS", 2);
const maxVUs = getPositiveIntegerFromEnv("MAX_VUS", 5);

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
