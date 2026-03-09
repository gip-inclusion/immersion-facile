import {
  type Assertion,
  global,
  rampConcurrentUsers,
  scenario,
  simulation,
} from "@gatling.io/core";
import { http } from "@gatling.io/http";

export default simulation((setUp) => {
  // Reference: https://docs.gatling.io/reference/script/protocols/http/protocol/
  const httpProtocol = http.baseUrl(
    "https://pentest.immersion-facile.beta.gouv.fr/api",
  );

  // https://docs.gatling.io/reference/script/core/scenario/
  const scn = scenario("Scenario")
    .exec(http("Session").get("/feature-flags"))
    .pause(1);

  // https://docs.gatling.io/reference/script/core/assertions/
  const assertions: Assertion[] = [
    global().responseTime().percentile(90).lt(100),
    global().failedRequests().percent().lt(0.01),
  ];

  // https://docs.gatling.io/reference/script/core/injection/
  setUp(
    scn.injectClosed(
      rampConcurrentUsers(0).to(50).during({ amount: 10, unit: "seconds" }),
    ),
  )
    .assertions(...assertions)
    .protocols(httpProtocol);
});
