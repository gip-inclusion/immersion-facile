import { check, sleep } from "k6";
import http from "k6/http";
import type { Options } from "k6/options";

export const options: Options = {
  vus: 50,
  duration: "10s",
  thresholds: {
    http_req_duration: ["p(90)<100"],
    http_req_failed: ["rate<0.01"],
  },
};

export default function () {
  const response = http.get(
    "https://pentest.immersion-facile.beta.gouv.fr/api/feature-flags",
  );
  check(response, {
    "status is 200": () => response.status === 200,
  });
  sleep(1);
}
