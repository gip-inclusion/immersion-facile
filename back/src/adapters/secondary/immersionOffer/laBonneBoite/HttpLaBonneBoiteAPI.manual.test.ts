import { noRateLimit } from "../../../../domain/core/ports/RateLimiter";
import { noRetries } from "../../../../domain/core/ports/RetryStrategy";
import { LaBonneBoiteRequestParams } from "../../../../domain/immersionOffer/ports/LaBonneBoiteAPI";
import { AppConfig } from "../../../primary/config/appConfig";
import { configureCreateHttpClientForExternalApi } from "../../../primary/config/createHttpClientForExternalApi";
import { PoleEmploiAccessTokenGateway } from "../PoleEmploiAccessTokenGateway";
import { HttpLaBonneBoiteAPI } from "./HttpLaBonneBoiteAPI";
import { createLbbTargets } from "./LaBonneBoiteTargets";

const config = AppConfig.createFromEnv();
const accessTokenGateway = new PoleEmploiAccessTokenGateway(
  config.poleEmploiAccessTokenConfig,
  noRateLimit,
  noRetries,
);

const getAPI = () =>
  new HttpLaBonneBoiteAPI(
    configureCreateHttpClientForExternalApi()(
      createLbbTargets(config.peApiUrl),
    ),
    accessTokenGateway,
    config.poleEmploiClientId,
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

  it(`Should support several of parallel calls, and queue the calls if over accepted rate`, async () => {
    const api = getAPI();

    const searches: LaBonneBoiteRequestParams[] = [
      searchParamsBoulangerAroundBenodet,
      { ...benodetLonLat, rome: "A1201" },
      { ...benodetLonLat, rome: "A1205" },
      { ...benodetLonLat, rome: "A1404" },
      { ...benodetLonLat, rome: "A1411" },
      { ...benodetLonLat, rome: "B1601" },
      { ...benodetLonLat, rome: "D1408" },
      { ...benodetLonLat, rome: "E1104" },
      { ...benodetLonLat, rome: "F1101" },
      { ...benodetLonLat, rome: "B1601" },
      { ...benodetLonLat, rome: "D1408" },
      { ...benodetLonLat, rome: "E1104" },
      { ...benodetLonLat, rome: "F1101" },
    ];

    const results = await Promise.all(
      searches.map((searchParams) =>
        api.searchCompanies(searchParams).catch((error) => {
          const responseBodyAsString = error.response?.data
            ? ` Body : ${JSON.stringify(error.response?.data)}`
            : "";

          throw new Error(
            `Could not call api correctly, status: ${error.response.status}.${responseBodyAsString}`,
          );
        }),
      ),
    );

    expect(results).toHaveLength(searches.length);
  }, 15_000);
});
