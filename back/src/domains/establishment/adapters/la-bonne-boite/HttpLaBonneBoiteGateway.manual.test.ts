import { expectToEqual } from "shared";
import { createFetchSharedClient } from "shared-routes/fetch";
import {
  AccessTokenResponse,
  AppConfig,
} from "../../../../config/bootstrap/appConfig";
import { createPeFetchSharedClient } from "../../../../config/helpers/createFetchSharedClients";
import { HttpFranceTravailGateway } from "../../../convention/adapters/pole-emploi-gateway/HttpFranceTravailGateway";
import { InMemoryCachingGateway } from "../../../core/caching-gateway/adapters/InMemoryCachingGateway";
import { noRetries } from "../../../core/retry-strategy/ports/RetryStrategy";
import { RealTimeGateway } from "../../../core/time-gateway/adapters/RealTimeGateway";
import { LaBonneBoiteRequestParams } from "../../ports/LaBonneBoiteGateway";
import { HttpLaBonneBoiteGateway } from "./HttpLaBonneBoiteGateway";
import { createLbbRoutes } from "./LaBonneBoite.routes";
import { LaBonneBoiteCompanyDtoBuilder } from "./LaBonneBoiteCompanyDtoBuilder";

const benodetLonLat = { lat: 47.8667, lon: -4.1167 };
const boulangerRomeData = {
  rome: "D1102",
  romeLabel: "Boulangerie - viennoiserie",
};
const searchResult = new LaBonneBoiteCompanyDtoBuilder()
  .withName("L'ENTREMETS GOURMAND")
  .withSiret("83906399700028")
  .withEmployeeRange(0, 0)
  .withNaf({
    code: "1071C",
    nomenclature: "Boulangerie et boulangerie-pâtisserie",
  })
  .withPosition({
    lat: 47.8734,
    lon: -4.12565,
  })
  .withRome(boulangerRomeData.rome)
  .withAddress({
    city: "Combrit",
    postcode: "29120",
    departmentCode: "29",
  })
  .build()
  .toSearchResult(
    {
      romeCode: boulangerRomeData.rome,
      romeLabel: boulangerRomeData.romeLabel,
    },
    benodetLonLat,
  );

describe("HttpLaBonneBoiteGateway", () => {
  let laBonneBoiteGateway: HttpLaBonneBoiteGateway;

  beforeEach(() => {
    const config = AppConfig.createFromEnv();
    const peFetchSharedClient = createPeFetchSharedClient(config);
    laBonneBoiteGateway = new HttpLaBonneBoiteGateway(
      createFetchSharedClient(createLbbRoutes(config.peApiUrl), fetch),
      new HttpFranceTravailGateway(
        peFetchSharedClient,
        new InMemoryCachingGateway<AccessTokenResponse>(
          new RealTimeGateway(),
          "expires_in",
        ),
        config.peApiUrl,
        config.poleEmploiAccessTokenConfig,
        noRetries,
      ),
      config.poleEmploiClientId,
    );
  });

  it("Should return the closest 90 `companies` susceptible to offer immersion of given rome located within the geographical area at 100km distance", async () => {
    const actualSearchedCompanies = await laBonneBoiteGateway.searchCompanies({
      lon: benodetLonLat.lon,
      lat: benodetLonLat.lat,
      distanceKm: 100,
      ...boulangerRomeData,
    });
    expect(actualSearchedCompanies).toHaveLength(100);
  });

  it("Should return the closest 1 `company` susceptible to offer immersion of given rome located within the geographical area at 1km distance", async () => {
    const actualSearchedCompanies = await laBonneBoiteGateway.searchCompanies({
      lon: benodetLonLat.lon,
      lat: benodetLonLat.lat,
      distanceKm: 1,
      ...boulangerRomeData,
    });

    expectToEqual(actualSearchedCompanies, [searchResult]);
  });

  it("Should support several of parallel calls, and queue the calls if over accepted rate", async () => {
    const searches: LaBonneBoiteRequestParams[] = [
      {
        lon: benodetLonLat.lon,
        lat: benodetLonLat.lat,
        distanceKm: 1,
        ...boulangerRomeData,
      },
      {
        ...benodetLonLat,
        rome: "A1201",
        distanceKm: 1,
        romeLabel: "Bûcheronnage et élagage",
      },
      {
        ...benodetLonLat,
        rome: "A1205",
        distanceKm: 1,
        romeLabel: "Sylviculture",
      },
      {
        ...benodetLonLat,
        rome: "A1404",
        distanceKm: 1,
        romeLabel: "Aquaculture",
      },
      {
        ...benodetLonLat,
        rome: "A1411",
        distanceKm: 1,
        romeLabel: "Élevage porcin",
      },
      {
        ...benodetLonLat,
        rome: "B1601",
        distanceKm: 1,
        romeLabel: "Métallerie d'art",
      },
      {
        ...benodetLonLat,
        rome: "D1408",
        distanceKm: 1,
        romeLabel: "Téléconseil et télévente",
      },
      {
        ...benodetLonLat,
        rome: "E1104",
        distanceKm: 1,
        romeLabel: "Conception de contenus multimédias",
      },
      {
        ...benodetLonLat,
        rome: "F1101",
        distanceKm: 1,
        romeLabel: "Architecture du BTP",
      },
      {
        ...benodetLonLat,
        rome: "B1601",
        distanceKm: 1,
        romeLabel: "Métallerie d'art",
      },
      {
        ...benodetLonLat,
        rome: "D1408",
        distanceKm: 1,
        romeLabel: "Téléconseil et télévente",
      },
      {
        ...benodetLonLat,
        rome: "E1104",
        distanceKm: 1,
        romeLabel: "Conception de contenus multimédias",
      },
      {
        ...benodetLonLat,
        rome: "F1101",
        distanceKm: 1,
        romeLabel: "Architecture du BTP",
      },
    ];

    const results = await Promise.all(
      searches.map((searchParams) =>
        laBonneBoiteGateway.searchCompanies(searchParams).catch((error) => {
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

  it("should retrieve only one company based on siret", async () => {
    const siret = "83906399700028";
    const result = await laBonneBoiteGateway.fetchCompanyBySiret(siret, {
      romeCode: boulangerRomeData.rome,
      romeLabel: boulangerRomeData.romeLabel,
    });
    expectToEqual(result, searchResult);
  });
});
