import { noRateLimit } from "../../../../domain/core/ports/RateLimiter";
import { noRetries } from "../../../../domain/core/ports/RetryStrategy";
import { LaBonneBoiteRequestParams } from "../../../../domain/immersionOffer/ports/LaBonneBoiteAPI";
import { AppConfig } from "../../../primary/config/appConfig";
import { PoleEmploiAccessTokenGateway } from "../PoleEmploiAccessTokenGateway";
import { HttpLaBonneBoiteAPI } from "./HttpLaBonneBoiteAPI";

const config = AppConfig.createFromEnv();
const accessTokenGateway = new PoleEmploiAccessTokenGateway(
  config.poleEmploiAccessTokenConfig,
  noRateLimit,
  noRetries,
);

const getAPI = () =>
  new HttpLaBonneBoiteAPI(
    config.peApiUrl,
    accessTokenGateway,
    config.poleEmploiClientId,
    noRateLimit,
    noRetries,
  );

const benodetLonLat = { lat: 47.8667, lon: -4.1167 };
const boulangerRome = "D1102";

const searchParamsBoulangerAroundBenodet: LaBonneBoiteRequestParams = {
  rome: boulangerRome,
  lon: benodetLonLat.lon,
  lat: benodetLonLat.lat,
};

describe("HttpLaBonneBoiteAPI", () => {
  it("Should return the closest 100 `companies` susceptible to offer immersion of given rome located within the geographical area", async () => {
    const api = getAPI();

    const actualSearchedCompanies = await api.searchCompanies(
      searchParamsBoulangerAroundBenodet,
    );

    expect(actualSearchedCompanies).toHaveLength(100);
  });
});
