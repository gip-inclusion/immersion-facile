import axios from "axios";
import { expectToEqual } from "shared";
import { createAxiosSharedClient } from "shared-routes/axios";
import { AppConfig } from "../../../../config/bootstrap/appConfig";
import { createPeAxiosSharedClient } from "../../../../config/helpers/createAxiosSharedClients";
import { HttpPoleEmploiGateway } from "../../../convention/adapters/pole-emploi-gateway/HttpPoleEmploiGateway";
import { GetAccessTokenResponse } from "../../../convention/ports/PoleEmploiGateway";
import { InMemoryCachingGateway } from "../../../core/caching-gateway/adapters/InMemoryCachingGateway";
import { noRetries } from "../../../core/retry-strategy/ports/RetryStrategy";
import { RealTimeGateway } from "../../../core/time-gateway/adapters/RealTimeGateway";
import { LaBonneBoiteRequestParams } from "../../ports/LaBonneBoiteGateway";
import { HttpLaBonneBoiteGateway } from "./HttpLaBonneBoiteGateway";
import { createLbbRoutes } from "./LaBonneBoite.routes";
import { LaBonneBoiteCompanyDtoBuilder } from "./LaBonneBoiteCompanyDtoBuilder";

const benodetLonLat = { lat: 47.8667, lon: -4.1167 };
const boulangerRome = "D1102";

describe("HttpLaBonneBoiteGateway", () => {
  let laBonneBoiteGateway: HttpLaBonneBoiteGateway;

  beforeEach(() => {
    const config = AppConfig.createFromEnv();
    const axiosHttpClient = createPeAxiosSharedClient(config);

    laBonneBoiteGateway = new HttpLaBonneBoiteGateway(
      createAxiosSharedClient(createLbbRoutes(config.peApiUrl), axios),
      new HttpPoleEmploiGateway(
        axiosHttpClient,
        new InMemoryCachingGateway<GetAccessTokenResponse>(
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
      rome: boulangerRome,
      lon: benodetLonLat.lon,
      lat: benodetLonLat.lat,
      distanceKm: 100,
    });

    expect(actualSearchedCompanies).toHaveLength(90);
  });

  it("Should return the closest 1 `company` susceptible to offer immersion of given rome located within the geographical area at 1km distance", async () => {
    const actualSearchedCompanies = await laBonneBoiteGateway.searchCompanies({
      rome: boulangerRome,
      lon: benodetLonLat.lon,
      lat: benodetLonLat.lat,
      distanceKm: 1,
    });

    expectToEqual(actualSearchedCompanies, [
      new LaBonneBoiteCompanyDtoBuilder()
        .withName("L'ENTREMETS GOURMAND")
        .withSiret("83906399700028")
        .withEmployeeRange("0")
        .withDistanceKm(1)
        .withNaf({
          code: "1071C",
          nomenclature: "Boulangerie et boulangerie-pâtisserie",
        })
        .withPosition({
          lat: 47.8734,
          lon: -4.12564,
        })
        .withRomeLabel("Boulangerie - viennoiserie")
        .withRome(boulangerRome)
        .withAddress("52 RUE DE L ODET, 29120 COMBRIT")
        .withUrlOfPartner(
          "https://labonneboite.pole-emploi.fr/83906399700028/details?rome_code=D1102&utm_medium=web&utm_source=api__emploi_store_dev&utm_campaign=api__emploi_store_dev__immersionfaciledev",
        )
        .build()
        .toSearchResult(),
    ]);
  });

  it("Should support several of parallel calls, and queue the calls if over accepted rate", async () => {
    const searches: LaBonneBoiteRequestParams[] = [
      {
        rome: boulangerRome,
        lon: benodetLonLat.lon,
        lat: benodetLonLat.lat,
        distanceKm: 1,
      },
      { ...benodetLonLat, rome: "A1201", distanceKm: 1 },
      { ...benodetLonLat, rome: "A1205", distanceKm: 1 },
      { ...benodetLonLat, rome: "A1404", distanceKm: 1 },
      { ...benodetLonLat, rome: "A1411", distanceKm: 1 },
      { ...benodetLonLat, rome: "B1601", distanceKm: 1 },
      { ...benodetLonLat, rome: "D1408", distanceKm: 1 },
      { ...benodetLonLat, rome: "E1104", distanceKm: 1 },
      { ...benodetLonLat, rome: "F1101", distanceKm: 1 },
      { ...benodetLonLat, rome: "B1601", distanceKm: 1 },
      { ...benodetLonLat, rome: "D1408", distanceKm: 1 },
      { ...benodetLonLat, rome: "E1104", distanceKm: 1 },
      { ...benodetLonLat, rome: "F1101", distanceKm: 1 },
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
});
