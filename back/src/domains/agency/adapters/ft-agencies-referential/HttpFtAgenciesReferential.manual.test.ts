import type { RedisClientType } from "redis";
import { AppConfig } from "../../../../config/bootstrap/appConfig";
import { makeConnectedRedisClient } from "../../../../config/bootstrap/cache";
import { createFtAxiosHttpClientForTest } from "../../../../config/helpers/createFtAxiosHttpClientForTest";
import { createFranceTravailRoutes } from "../../../convention/adapters/france-travail-gateway/FrancetTravailRoutes";
import { HttpFranceTravailGateway } from "../../../convention/adapters/france-travail-gateway/HttpFranceTravailGateway";
import { makeRedisWithCache } from "../../../core/caching-gateway/adapters/makeRedisWithCache";
import { noRetries } from "../../../core/retry-strategy/ports/RetryStrategy";
import { HttpFtAgenciesReferential } from "./HttpFtAgenciesReferential";

const config = AppConfig.createFromEnv();

describe("HttpReferencielAgencesPe", () => {
  let referencielAgencesPE: HttpFtAgenciesReferential;
  let redisClient: RedisClientType<any, any, any>;

  beforeAll(async () => {
    redisClient = await makeConnectedRedisClient(config);

    const withCache = makeRedisWithCache({
      defaultCacheDurationInHours: 1,
      redisClient,
    });

    referencielAgencesPE = new HttpFtAgenciesReferential(
      config.ftApiUrl,
      new HttpFranceTravailGateway(
        createFtAxiosHttpClientForTest(config),
        withCache,
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
  });

  afterAll(async () => {
    await redisClient.disconnect();
  });

  it("Should return PE agencies", async () => {
    const a = await referencielAgencesPE.getFtAgencies();
    expect(a.length).toBeGreaterThan(10);
  });
});
