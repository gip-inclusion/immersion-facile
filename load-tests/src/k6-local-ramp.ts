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
const targetRps = getPositiveIntegerFromEnv("TARGET_RPS", 5000);
const preAllocatedVUs = getPositiveIntegerFromEnv("PRE_ALLOCATED_VUS", 1000);
const maxVUs = getPositiveIntegerFromEnv("MAX_VUS", 4000);

export const options: Options = {
  scenarios: {
    featureFlags: {
      executor: "ramping-arrival-rate",
      startRate: 1,
      timeUnit: "1s",
      preAllocatedVUs,
      maxVUs,
      stages: [
        { duration: "10s", target: Math.round(targetRps * 0.1) },
        { duration: "20s", target: Math.round(targetRps * 0.25) },
        { duration: "20s", target: Math.round(targetRps * 0.5) },
        { duration: "30s", target: targetRps },
        { duration: "10s", target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<500", "p(99)<1000"],
  },
};

export default function () {
  const response = http.get(targetUrl);

  check(response, {
    "status is 200": () => response.status === 200,
  });
}
