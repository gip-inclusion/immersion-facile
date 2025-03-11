import {
  type GeoPositionDto,
  type NafCode,
  type RomeDto,
  expectToEqual,
} from "shared";
import { createFetchSharedClient } from "shared-routes/fetch";
import {
  type AccessTokenResponse,
  AppConfig,
} from "../../../../config/bootstrap/appConfig";
import { createFtFetchSharedClient } from "../../../../config/helpers/createFetchSharedClients";
import { HttpFranceTravailGateway } from "../../../convention/adapters/france-travail-gateway/HttpFranceTravailGateway";
import { InMemoryCachingGateway } from "../../../core/caching-gateway/adapters/InMemoryCachingGateway";
import { withNoCache } from "../../../core/caching-gateway/adapters/withNoCache";
import { noRetries } from "../../../core/retry-strategy/ports/RetryStrategy";
import { RealTimeGateway } from "../../../core/time-gateway/adapters/RealTimeGateway";
import type { SearchCompaniesParams } from "../../ports/LaBonneBoiteGateway";
import { HttpLaBonneBoiteGateway } from "./HttpLaBonneBoiteGateway";
import { createLbbRoutes } from "./LaBonneBoite.routes";
import { LaBonneBoiteCompanyDtoBuilder } from "./LaBonneBoiteCompanyDtoBuilder";

describe("HttpLaBonneBoiteGateway", () => {
  const benodetLonLat: GeoPositionDto = { lat: 47.8667, lon: -4.1167 };
  const boulangerRomeData: RomeDto = {
    romeCode: "D1102",
    romeLabel: "Boulangerie - viennoiserie",
  };

  let laBonneBoiteGateway: HttpLaBonneBoiteGateway;

  beforeEach(() => {
    const config = AppConfig.createFromEnv();
    laBonneBoiteGateway = new HttpLaBonneBoiteGateway(
      createFetchSharedClient(createLbbRoutes(config.ftApiUrl), fetch),
      new HttpFranceTravailGateway(
        createFtFetchSharedClient(config),
        new InMemoryCachingGateway<AccessTokenResponse>(
          new RealTimeGateway(),
          "expires_in",
        ),
        config.ftApiUrl,
        config.franceTravailAccessTokenConfig,
        noRetries,
      ),
      config.franceTravailClientId,
      withNoCache,
      createLbbRoutes(config.ftApiUrl),
    );
  });

  describe("searchCompanies", () => {
    it("Should return the closest 90 `companies` susceptible to offer immersion of given rome located within the geographical area at 100km distance", async () => {
      const actualSearchedCompanies = await laBonneBoiteGateway.searchCompanies(
        {
          lon: benodetLonLat.lon,
          lat: benodetLonLat.lat,
          distanceKm: 100,
          ...boulangerRomeData,
        },
      );
      expect(actualSearchedCompanies).toHaveLength(100);
    });

    it("Should return the closest 1 `company` susceptible to offer immersion of given rome located within the geographical area at 1km distance", async () => {
      const actualSearchedCompanies = await laBonneBoiteGateway.searchCompanies(
        {
          ...benodetLonLat,
          ...boulangerRomeData,
          distanceKm: 5,
        },
      );

      expectToEqual(actualSearchedCompanies, [
        {
          address: {
            city: "Combrit",
            departmentCode: "29",
            postcode: "29120",
            streetNumberAndAddress: "",
          },
          appellations: [],
          establishmentScore: 0,
          locationId: null,
          naf: "4711F",
          nafLabel: "Hypermarchés",
          name: "SAS BIGOUDIS",
          position: { lat: 47.8847, lon: -4.17156 },
          rome: "D1102",
          romeLabel: "Boulangerie - viennoiserie",
          siret: "34916617300014",
          voluntaryToImmersion: false,
          distance_m: 4555,
          numberOfEmployeeRange: "50-99",
          urlOfPartner:
            "https://labonneboite.francetravail.fr/entreprise/34916617300014",
        },
      ]);
    });

    it("Should support several of parallel calls, and queue the calls if over accepted rate", async () => {
      const distanceKm = 10;
      const searches: SearchCompaniesParams[] = [
        {
          ...benodetLonLat,
          distanceKm,
          ...boulangerRomeData,
        },
        {
          ...benodetLonLat,
          distanceKm,
          romeCode: "A1201",
          romeLabel: "Bûcheronnage et élagage",
        },
        {
          ...benodetLonLat,
          distanceKm,
          romeCode: "A1205",
          romeLabel: "Sylviculture",
        },
        {
          ...benodetLonLat,
          distanceKm,
          romeCode: "A1404",
          romeLabel: "Aquaculture",
        },
        {
          ...benodetLonLat,
          distanceKm,
          romeCode: "A1411",
          romeLabel: "Élevage porcin",
        },
        {
          ...benodetLonLat,
          distanceKm,
          romeCode: "B1601",
          romeLabel: "Métallerie d'art",
        },
        {
          ...benodetLonLat,
          distanceKm,
          romeCode: "D1408",
          romeLabel: "Téléconseil et télévente",
        },
        {
          ...benodetLonLat,
          distanceKm,
          romeCode: "E1104",
          romeLabel: "Conception de contenus multimédias",
        },
        {
          ...benodetLonLat,
          distanceKm,
          romeCode: "F1101",
          romeLabel: "Architecture du BTP",
        },
        {
          ...benodetLonLat,
          distanceKm,
          romeCode: "B1601",
          romeLabel: "Métallerie d'art",
        },
        {
          ...benodetLonLat,
          distanceKm,
          romeCode: "D1408",
          romeLabel: "Téléconseil et télévente",
        },
        {
          ...benodetLonLat,
          distanceKm,
          romeCode: "E1104",
          romeLabel: "Conception de contenus multimédias",
        },
        {
          ...benodetLonLat,
          distanceKm,
          romeCode: "F1101",
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

    it("should get results only with Naf code", async () => {
      const nafCode: NafCode = "1072Z";
      const actualSearchedCompanies = await laBonneBoiteGateway.searchCompanies(
        {
          lon: benodetLonLat.lon,
          lat: benodetLonLat.lat,
          distanceKm: 10,
          ...boulangerRomeData,
          nafCodes: [nafCode],
        },
      );

      expectToEqual(actualSearchedCompanies, [
        {
          address: {
            city: "Bénodet",
            departmentCode: "29",
            postcode: "29950",
            streetNumberAndAddress: "",
          },
          appellations: [],
          distance_m: 3192,
          establishmentScore: 0,
          locationId: null,
          naf: nafCode,
          nafLabel:
            "Fabrication de biscuits, biscottes et pâtisseries de conservation",
          name: "BISCUITERIE DU MOUSTOIR",
          numberOfEmployeeRange: "20-49",
          position: { lat: 47.8771, lon: -4.07681 },
          rome: "D1102",
          romeLabel: "Boulangerie - viennoiserie",
          siret: "38929074300027",
          urlOfPartner:
            "https://labonneboite.francetravail.fr/entreprise/38929074300027",
          voluntaryToImmersion: false,
        },
      ]);
    });
  });

  describe("fetchCompanyBySiret", () => {
    it("should retrieve only one company based on siret", async () => {
      const siret = "38774939300048";
      const result = await laBonneBoiteGateway.fetchCompanyBySiret(
        siret,
        boulangerRomeData,
      );

      expectToEqual(
        result,
        new LaBonneBoiteCompanyDtoBuilder()
          .withName("UAB")
          .withSiret("38774939300048")
          .withEmployeeRange(0, 0)
          .withNaf({
            code: "4781Z",
            nomenclature:
              "Commerce de détail alimentaire sur éventaires et marchés",
          })
          .withPosition({
            lat: 48.8133,
            lon: 2.45697,
          })
          .withRome(boulangerRomeData.romeCode)
          .withAddress({
            city: "Saint-Maurice",
            postcode: "94410",
            departmentCode: "94",
          })
          .build()
          .toSearchResult(boulangerRomeData),
      );
    });
  });
});
