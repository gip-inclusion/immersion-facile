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
import { HttpRome3Gateway, makeRome3Routes } from "./HttpRome3Gateway";

describe("HttpRome3Gateway", () => {
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

  const httpRome3Gateway = new HttpRome3Gateway(
    createAxiosSharedClient(makeRome3Routes(config.ftApiUrl), axios),
    franceTravailGateway,
    config.franceTravailClientId,
  );

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
