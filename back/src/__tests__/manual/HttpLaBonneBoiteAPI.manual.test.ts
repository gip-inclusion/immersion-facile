import { AppConfig } from "../../adapters/primary/appConfig";
import { HttpLaBonneBoiteAPI } from "../../adapters/secondary/immersionOffer/HttpLaBonneBoiteAPI";
import { PoleEmploiAccessTokenGateway } from "../../adapters/secondary/immersionOffer/PoleEmploiAccessTokenGateway";
import { noRateLimit } from "../../domain/core/ports/RateLimiter";
import { noRetries } from "../../domain/core/ports/RetryStrategy";
import { distanceBetweenCoordinates } from "../../utils/distanceBetweenCoordinates";

const config = AppConfig.createFromEnv();
const accessTokenGateway = new PoleEmploiAccessTokenGateway(
  config.poleEmploiAccessTokenConfig,
  noRateLimit,
  noRetries,
);

const getAPI = () =>
  new HttpLaBonneBoiteAPI(
    accessTokenGateway,
    config.poleEmploiClientId,
    noRateLimit,
    noRetries,
  );

const benodetLonLat = { lat: 47.8667, lon: -4.1167 };
const boulangerRome = "D1102";

describe("HttpLaBonneBoiteAPI", () => {
  test("Should return at the most 20 establishments of given rome located within the geographical area", async () => {
    const api = getAPI();
    const searchLonLat = benodetLonLat;
    const response = await api.searchCompanies({
      rome: boulangerRome,
      lon: searchLonLat.lon,
      lat: searchLonLat.lat,
      distance_km: 100,
    });
    expect(response.length).toBeLessThanOrEqual(20);

    const processedResponse = response.map((lBBCompanny) => ({
      siret: lBBCompanny.siret,
      rome: lBBCompanny.props.matched_rome_code,
      distance: distanceBetweenCoordinates(
        lBBCompanny.props.lat,
        lBBCompanny.props.lon,
        searchLonLat.lat,
        searchLonLat.lon,
      ),
    }));

    expect(processedResponse.every(({ distance }) => distance <= 100000)).toBe(
      true,
    );
  });
});
