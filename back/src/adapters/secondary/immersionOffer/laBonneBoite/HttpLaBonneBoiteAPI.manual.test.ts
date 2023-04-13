import axios, { AxiosResponse } from "axios";

import { noRateLimit } from "../../../../domain/core/ports/RateLimiter";
import { noRetries } from "../../../../domain/core/ports/RetryStrategy";
import { LaBonneBoiteRequestParams } from "../../../../domain/immersionOffer/ports/LaBonneBoiteAPI";
import { distanceBetweenCoordinatesInMeters } from "../../../../utils/distanceBetweenCoordinatesInMeters";
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
const parisLonLat = { lat: 50.49, lon: 2.43 };
const boulangerRome = "D1102";

const searchParamsBoulanger100KmAroundBenodet: LaBonneBoiteRequestParams = {
  rome: boulangerRome,
  lon: benodetLonLat.lon,
  lat: benodetLonLat.lat,
  distance_km: 100,
};

const searchParamsBoulanger50KmAroundParis: LaBonneBoiteRequestParams = {
  rome: boulangerRome,
  lon: parisLonLat.lon,
  lat: parisLonLat.lat,
  distance_km: 50,
};

type HttpGetLaBonneBoiteCompanyCountResponse = {
  companies_count: number;
  rome_code: string;
  rome_label: string;
  url: string;
};

const getCompaniesCountFromAPI = async (
  searchParams: LaBonneBoiteRequestParams,
) => {
  const accessToken = await accessTokenGateway.getAccessToken(
    `application_${config.poleEmploiClientId} api_labonneboitev1`,
  );
  const countResponse: AxiosResponse<HttpGetLaBonneBoiteCompanyCountResponse> =
    await axios.get(
      "https://api.emploi-store.fr/partenaire/labonneboite/v1/company/count",
      {
        headers: {
          Authorization: `Bearer ${accessToken.access_token}`,
        },
        params: {
          distance: searchParams.distance_km,
          longitude: searchParams.lon,
          latitude: searchParams.lat,
          rome_codes: searchParams.rome,
        },
      },
    );
  return countResponse.data.companies_count;
};
describe("HttpLaBonneBoiteAPI", () => {
  it("Should return all `companies` susceptible to offer immerison of given rome located within the geographical area", async () => {
    const api = getAPI();
    const searchParams = searchParamsBoulanger100KmAroundBenodet;
    const actualSearchedCompanies = await api.searchCompanies(searchParams);
    const expectedSearchedCompaniesCount = await getCompaniesCountFromAPI(
      searchParams,
    );

    expect(actualSearchedCompanies).toHaveLength(
      expectedSearchedCompaniesCount,
    );

    const processedResponse = actualSearchedCompanies.map((lBBCompanny) => ({
      siret: lBBCompanny.siret,
      rome: lBBCompanny.props.matched_rome_code,
      distance: distanceBetweenCoordinatesInMeters(
        lBBCompanny.props.lat,
        lBBCompanny.props.lon,
        searchParams.lat,
        searchParams.lon,
      ),
    }));

    expect(processedResponse.every(({ distance }) => distance <= 100000)).toBe(
      true,
    );
  });

  it("Should not last more than 3 seconds even for search with many results", async () => {
    const api = getAPI();

    const startTime = new Date();
    const actualSearchedCompanies = await api.searchCompanies(
      searchParamsBoulanger50KmAroundParis,
    );
    const executionDurationMs = new Date().getTime() - startTime.getTime();
    expect(actualSearchedCompanies.length).toBeGreaterThan(500);
    expect(executionDurationMs).toBeLessThan(3000);
  });
});
