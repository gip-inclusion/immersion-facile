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
import { HttpRome4Gateway, makeRome4Routes } from "./HttpRome4Gateway";

describe("HttpRome4Gateway", () => {
  const config = AppConfig.createFromEnv();
  let redisClient: RedisClientType<any, any, any>;
  let httpRome4Gateway: HttpRome4Gateway;

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

    httpRome4Gateway = new HttpRome4Gateway(
      createAxiosSharedClient(
        makeRome4Routes(config.ftApiUrl),
        makeAxiosInstances(config.externalAxiosTimeout).axiosWithValidateStatus,
      ),
      franceTravailGateway,
      config.franceTravailClientId,
    );
  });

  afterAll(async () => {
    await redisClient.disconnect();
  });

  it("fetches the updated list of romes", async () => {
    const response = await httpRome4Gateway.getAllRomes();
    expect(response.length).toBeGreaterThan(600);
    expect(response.length).toBeLessThan(700);
    expectToEqual(response[0], {
      romeCode: "A1101",
      romeLabel: "Conducteur / Conductrice d'engins agricoles",
    });
  });

  it("fetches the updated list of appellations", async () => {
    const response = await httpRome4Gateway.getAllAppellations();
    expect(response.length).toBeGreaterThan(11_500);
    expect(response.length).toBeLessThan(15_000);
    expectToEqual(response[0], {
      appellationCode: "10605",
      appellationLabel: "Agent / Agente de service expédition marchandises",
      appellationLabelShort:
        "Agent / Agente de service expédition marchandises",
      romeCode: "N1103",
    });
  });
});
