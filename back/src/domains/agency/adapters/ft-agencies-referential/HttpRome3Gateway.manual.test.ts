import type { RedisClientType } from "redis";
import { expectToEqual } from "shared";
import { createAxiosSharedClient } from "shared-routes/axios";
import { AppConfig } from "../../../../config/bootstrap/appConfig";
import { makeConnectedRedisClient } from "../../../../config/bootstrap/cache";
import { createFtAxiosHttpClientForTest } from "../../../../config/helpers/createFtAxiosHttpClientForTest";
import { makeAxiosInstances } from "../../../../utils/axiosUtils";
import { createFranceTravailRoutes } from "../../../convention/adapters/france-travail-gateway/FrancetTravailRoutes";
import { HttpFranceTravailGateway } from "../../../convention/adapters/france-travail-gateway/HttpFranceTravailGateway";
import { makeRedisWithCache } from "../../../core/caching-gateway/adapters/makeRedisWithCache";
import { noRetries } from "../../../core/retry-strategy/ports/RetryStrategy";
import { HttpRome3Gateway, makeRome3Routes } from "./HttpRome3Gateway";

describe("HttpRome3Gateway", () => {
  const config = AppConfig.createFromEnv();
  let redisClient: RedisClientType<any, any, any>;
  let httpRome3Gateway: HttpRome3Gateway;

  beforeAll(async () => {
    redisClient = await makeConnectedRedisClient(config);

    const withCache = makeRedisWithCache({
      defaultCacheDurationInHours: 1,
      redisClient,
    });

    const franceTravailGateway = new HttpFranceTravailGateway(
      createFtAxiosHttpClientForTest(config),
      withCache,
      config.ftApiUrl,
      config.franceTravailAccessTokenConfig,
      noRetries,
      createFranceTravailRoutes({
        ftApiUrl: config.ftApiUrl,
        ftEnterpriseUrl: config.ftEnterpriseUrl,
      }),
    );

    httpRome3Gateway = new HttpRome3Gateway(
      createAxiosSharedClient(
        makeRome3Routes(config.ftApiUrl),
        makeAxiosInstances(config.externalAxiosTimeout)
          .axiosWithoutValidateStatus,
      ),
      franceTravailGateway,
      config.franceTravailClientId,
    );
  });

  afterAll(async () => {
    await redisClient.disconnect();
  });

  it("fetches the updated list of appellations, with their rome code (all in ROME v3)", async () => {
    const response = await httpRome3Gateway.getAllAppellations();
    expect(response.length).toBeGreaterThan(11_500);
    expect(response.length).toBeLessThan(15_000);
    expectToEqual(response[0], {
      appellationCode: "10320",
      appellationLabel:
        "Aérodynamicien / Aérodynamicienne en études, recherche et développement",
      appellationLabelShort:
        "Aérodynamicien(ne) en études, recherche et développement",
      romeCode: "H1206",
    });
  });
});
