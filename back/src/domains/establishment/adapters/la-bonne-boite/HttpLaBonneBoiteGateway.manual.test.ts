import type { RedisClientType } from "redis";
import {
  type ExternalOfferDto,
  expectToEqual,
  type GeoPositionDto,
  type NafCode,
  type RomeDto,
} from "shared";
import { createAxiosSharedClient } from "shared-routes/axios";
import { createFetchSharedClient } from "shared-routes/fetch";
import { AppConfig } from "../../../../config/bootstrap/appConfig";
import { makeConnectedRedisClient } from "../../../../config/bootstrap/cache";
import { makeAxiosInstances } from "../../../../utils/axiosUtils";
import { createFranceTravailRoutes } from "../../../convention/adapters/france-travail-gateway/FrancetTravailRoutes";
import { HttpFranceTravailGateway } from "../../../convention/adapters/france-travail-gateway/HttpFranceTravailGateway";
import { makeRedisWithCache } from "../../../core/caching-gateway/adapters/makeRedisWithCache";
import { withNoCache } from "../../../core/caching-gateway/adapters/withNoCache";
import type { WithCache } from "../../../core/caching-gateway/port/WithCache";
import { noRetries } from "../../../core/retry-strategy/ports/RetryStrategy";
import type { SearchCompaniesParams } from "../../ports/LaBonneBoiteGateway";
import { HttpLaBonneBoiteGateway } from "./HttpLaBonneBoiteGateway";
import { createLbbRoutes } from "./LaBonneBoite.routes";
import { LaBonneBoiteCompanyDtoBuilder } from "./LaBonneBoiteCompanyDtoBuilder";

describe("HttpLaBonneBoiteGateway", () => {
  const benodetLonLat: GeoPositionDto = { lat: 47.8667, lon: -4.1167 };
  const parisLonLat: GeoPositionDto = { lat: 48.8566, lon: 2.3522 };
  const boulangerRomeData: RomeDto = {
    romeCode: "D1102",
    romeLabel: "Boulangerie - viennoiserie",
  };
  const config = AppConfig.createFromEnv();

  let laBonneBoiteGateway: HttpLaBonneBoiteGateway;
  let redisClient: RedisClientType<any, any, any>;
  let withCache: WithCache;

  beforeAll(async () => {
    redisClient = await makeConnectedRedisClient(config);
    withCache = makeRedisWithCache({
      defaultCacheDurationInHours: 1,
      redisClient,
    });
  });

  afterAll(async () => {
    await redisClient.disconnect();
  });

  beforeEach(() => {
    laBonneBoiteGateway = new HttpLaBonneBoiteGateway(
      createFetchSharedClient(createLbbRoutes(config.ftApiUrl), fetch),
      new HttpFranceTravailGateway(
        createAxiosSharedClient(
          createFranceTravailRoutes({
            ftApiUrl: config.ftApiUrl,
            ftEnterpriseUrl: config.ftEnterpriseUrl,
          }),
          makeAxiosInstances(config.externalAxiosTimeout)
            .axiosWithValidateStatus,
        ),
        withCache,
        config.ftApiUrl,
        config.franceTravailAccessTokenConfig,
        noRetries,
        createFranceTravailRoutes({
          ftApiUrl: config.ftApiUrl,
          ftEnterpriseUrl: config.ftEnterpriseUrl,
        }),
      ),
      config.franceTravailClientId,
      withNoCache,
      createLbbRoutes(config.ftApiUrl),
    );
  });

  describe("searchCompanies", () => {
    it("Should return the closest `companies` susceptible to offer immersion of given rome located within the geographical area at 100km distance (default page size is 50)", async () => {
      const actualSearchedCompanies = await laBonneBoiteGateway.searchCompanies(
        {
          lon: benodetLonLat.lon,
          lat: benodetLonLat.lat,
          distanceKm: 100,
          ...boulangerRomeData,
        },
      );
      expect(actualSearchedCompanies).toHaveLength(50);
    });

    it("Should return the closest 1 `company` susceptible to offer immersion of given rome located within the geographical area at 1km distance", async () => {
      const actualSearchedCompanies = await laBonneBoiteGateway.searchCompanies(
        {
          ...benodetLonLat,
          ...boulangerRomeData,
          distanceKm: 5,
          perPage: 1,
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
          fitForDisabledWorkers: null,
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
          fitForDisabledWorkers: null,
        },
      ]);
    });
    it("should get results with pagination parameters and results are not the same on each page", async () => {
      const actualResultsOnPage1 = await laBonneBoiteGateway.searchCompanies({
        lon: parisLonLat.lon,
        lat: parisLonLat.lat,
        distanceKm: 1,
        ...boulangerRomeData,
        page: 1,
        perPage: 2,
      });
      const actualResultsOnPage2 = await laBonneBoiteGateway.searchCompanies({
        lon: parisLonLat.lon,
        lat: parisLonLat.lat,
        distanceKm: 1,
        ...boulangerRomeData,
        page: 2,
        perPage: 2,
      });
      const expectedResultsOnPage1: ExternalOfferDto[] = [
        {
          address: {
            city: "Paris",
            departmentCode: "75",
            postcode: "75003",
            streetNumberAndAddress: "",
          },
          appellations: [],
          distance_m: 885,
          establishmentScore: 0,
          fitForDisabledWorkers: null,
          locationId: null,
          naf: "1071C",
          nafLabel: "Boulangerie et boulangerie-pâtisserie",
          name: "AUX DELICES DE LEA",
          numberOfEmployeeRange: "0-0",
          position: {
            lat: 48.8635,
            lon: 2.35824,
          },
          rome: "D1102",
          romeLabel: "Boulangerie - viennoiserie",
          siret: "85036650100011",
          urlOfPartner:
            "https://labonneboite.francetravail.fr/entreprise/85036650100011",
          voluntaryToImmersion: false,
        },
        {
          address: {
            city: "Paris",
            departmentCode: "75",
            postcode: "75001",
            streetNumberAndAddress: "",
          },
          appellations: [],
          distance_m: 941,
          establishmentScore: 0,
          fitForDisabledWorkers: null,
          locationId: null,
          naf: "1071C",
          nafLabel: "Boulangerie et boulangerie-pâtisserie",
          name: "LNB EVOLUTION",
          numberOfEmployeeRange: "50-99",
          position: {
            lat: 48.8607,
            lon: 2.34094,
          },
          rome: "D1102",
          romeLabel: "Boulangerie - viennoiserie",
          siret: "88443942300010",
          urlOfPartner:
            "https://labonneboite.francetravail.fr/entreprise/88443942300010",
          voluntaryToImmersion: false,
        },
      ];
      const expectedResultsOnPage2: ExternalOfferDto[] = [
        {
          address: {
            city: "Paris",
            departmentCode: "75",
            postcode: "75001",
            streetNumberAndAddress: "",
          },
          appellations: [],
          distance_m: 855,
          establishmentScore: 0,
          fitForDisabledWorkers: null,
          locationId: null,
          naf: "1071C",
          nafLabel: "Boulangerie et boulangerie-pâtisserie",
          name: "DE BELLES MANIERES",
          numberOfEmployeeRange: "10-19",
          position: {
            lat: 48.8637,
            lon: 2.3477,
          },
          rome: "D1102",
          romeLabel: "Boulangerie - viennoiserie",
          siret: "50843100400037",
          urlOfPartner:
            "https://labonneboite.francetravail.fr/entreprise/50843100400037",
          voluntaryToImmersion: false,
        },
        {
          address: {
            city: "Paris",
            departmentCode: "75",
            postcode: "75001",
            streetNumberAndAddress: "",
          },
          appellations: [],
          distance_m: 644,
          establishmentScore: 0,
          fitForDisabledWorkers: null,
          locationId: null,
          naf: "1071C",
          nafLabel: "Boulangerie et boulangerie-pâtisserie",
          name: "SARL LPB",
          numberOfEmployeeRange: "20-49",
          position: {
            lat: 48.8605,
            lon: 2.34569,
          },
          rome: "D1102",
          romeLabel: "Boulangerie - viennoiserie",
          siret: "81254993900013",
          urlOfPartner:
            "https://labonneboite.francetravail.fr/entreprise/81254993900013",
          voluntaryToImmersion: false,
        },
      ];
      expect(actualResultsOnPage1).toHaveLength(2);
      expectToEqual(actualResultsOnPage1, expectedResultsOnPage1);
      expect(actualResultsOnPage2).toHaveLength(2);
      expectToEqual(actualResultsOnPage2, expectedResultsOnPage2);
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
