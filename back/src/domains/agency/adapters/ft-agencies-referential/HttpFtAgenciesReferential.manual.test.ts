import { AppConfig } from "../../../../config/bootstrap/appConfig";
import { createFtAxiosHttpClientForTest } from "../../../../config/helpers/createFtAxiosHttpClientForTest";
import { createFranceTravailRoutes } from "../../../convention/adapters/france-travail-gateway/FrancetTravailRoutes";
import { HttpFranceTravailGateway } from "../../../convention/adapters/france-travail-gateway/HttpFranceTravailGateway";
import { withNoCache } from "../../../core/caching-gateway/adapters/withNoCache";
import { noRetries } from "../../../core/retry-strategy/ports/RetryStrategy";
import { HttpFtAgenciesReferential } from "./HttpFtAgenciesReferential";

const config = AppConfig.createFromEnv();

const referencielAgencesPE = new HttpFtAgenciesReferential(
  config.ftApiUrl,
  new HttpFranceTravailGateway(
    createFtAxiosHttpClientForTest(config),
    withNoCache,
    config.ftApiUrl,
    config.franceTravailAccessTokenConfig,
    noRetries,
    createFranceTravailRoutes({
      ftApiUrl: config.ftApiUrl,
      ftEnterpriseUrl: config.ftEnterpriseUrl,
    }),
  ),
  config.franceTravailClientId,
);

describe("HttpReferencielAgencesPe", () => {
  it("Should return PE agencies", async () => {
    const a = await referencielAgencesPE.getFtAgencies();
    expect(a.length).toBeGreaterThan(10);
  });
});
