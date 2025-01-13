import axios from "axios";
import { expectToEqual } from "shared";
import { createAxiosSharedClient } from "shared-routes/axios";
import {
  AccessTokenResponse,
  AppConfig,
} from "../../../../config/bootstrap/appConfig";
import { createPeAxiosSharedClient } from "../../../../config/helpers/createAxiosSharedClients";
import { HttpFranceTravailGateway } from "../../../convention/adapters/france-travail-gateway/HttpFranceTravailGateway";
import { InMemoryCachingGateway } from "../../../core/caching-gateway/adapters/InMemoryCachingGateway";
import { noRetries } from "../../../core/retry-strategy/ports/RetryStrategy";
import { RealTimeGateway } from "../../../core/time-gateway/adapters/RealTimeGateway";
import { HttpRome4Gateway, makeRome4Routes } from "./HttpRome4Gateway";

describe("HttpRome4Gateway", () => {
  const config = AppConfig.createFromEnv();

  const cachingGateway = new InMemoryCachingGateway<AccessTokenResponse>(
    new RealTimeGateway(),
    "expires_in",
  );

  const franceTravailGateway = new HttpFranceTravailGateway(
    createPeAxiosSharedClient(config),
    cachingGateway,
    config.ftApiUrl,
    config.franceTravailAccessTokenConfig,
    noRetries,
  );

  const httpRome4Gateway = new HttpRome4Gateway(
    createAxiosSharedClient(makeRome4Routes(config.ftApiUrl), axios),
    franceTravailGateway,
    config.franceTravailClientId,
  );

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
