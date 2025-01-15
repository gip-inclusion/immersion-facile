import {
  AccessTokenResponse,
  AppConfig,
} from "../../../../config/bootstrap/appConfig";
import { createFtAxiosSharedClient } from "../../../../config/helpers/createAxiosSharedClients";
import { HttpFranceTravailGateway } from "../../../convention/adapters/france-travail-gateway/HttpFranceTravailGateway";
import { InMemoryCachingGateway } from "../../../core/caching-gateway/adapters/InMemoryCachingGateway";
import { noRetries } from "../../../core/retry-strategy/ports/RetryStrategy";
import { RealTimeGateway } from "../../../core/time-gateway/adapters/RealTimeGateway";
import { HttpFtAgenciesReferential } from "./HttpFtAgenciesReferential";

const config = AppConfig.createFromEnv();
const axiosHttpClient = createFtAxiosSharedClient(config);

const referencielAgencesPE = new HttpFtAgenciesReferential(
  config.ftApiUrl,
  new HttpFranceTravailGateway(
    axiosHttpClient,
    new InMemoryCachingGateway<AccessTokenResponse>(
      new RealTimeGateway(),
      "expires_in",
    ),
    config.ftApiUrl,
    config.franceTravailAccessTokenConfig,
    noRetries,
  ),
  config.franceTravailClientId,
);

describe("HttpReferencielAgencesPe", () => {
  it("Should return PE agencies", async () => {
    const a = await referencielAgencesPE.getFtAgencies();
    expect(a.length).toBeGreaterThan(10);
  });
});
