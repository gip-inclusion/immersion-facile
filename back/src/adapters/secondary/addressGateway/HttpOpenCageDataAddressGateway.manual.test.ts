import {
  AddressAndPosition,
  AddressDto,
  expectPromiseToFailWithError,
  expectToEqual,
  expectTypeToMatchAndEqual,
  GeoPositionDto,
  LookupSearchResult,
} from "shared";

import { AddressGateway } from "../../../domain/immersionOffer/ports/AddressGateway";
import { AppConfig } from "../../primary/config/appConfig";
import { httpAdresseApiClient } from "./HttpApiAdresseAddressGateway";

import {
  createHttpOpenCageDataClient,
  HttpOpenCageDataAddressGateway,
  minimumCharErrorMessage,
  OpenCageDataTargets,
  openCageDataTargets,
} from "./HttpOpenCageDataAddressGateway";

const resultFromApiAddress = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      position: {
        type: "Point",
        coordinates: [7.511081, 48.532594],
      },
      properties: {
        label: "14 Rue Gaston Romazzotti 67120 Molsheim",
        score: 0.9999999831759846,
        housenumber: "14",
        id: "67300_0263_00014",
        name: "14 Rue Gaston Romazzotti",
        postcode: "67120",
        citycode: "67300",
        x: 1032871.72,
        y: 6835328.47,
        city: "Molsheim",
        context: "67, Bas-Rhin, Grand Est",
        type: "housenumber",
        importance: 0.55443,
        street: "Rue Gaston Romazzotti",
      },
    },
  ],
};

const geocodingApiKey = AppConfig.createFromEnv().apiKeyOpenCageDataGeocoding;
const geosearchApiKey = AppConfig.createFromEnv().apiKeyOpenCageDataGeosearch;

describe("HttpOpenCageDataAddressGateway", () => {
  let httpAddressGateway: AddressGateway;

  beforeEach(() => {
    httpAddressGateway = new HttpOpenCageDataAddressGateway(
      createHttpOpenCageDataClient<OpenCageDataTargets>(openCageDataTargets),
      httpAdresseApiClient,
      geocodingApiKey,
      geosearchApiKey,
    );
  });

  describe("lookupStreetAddress", () => {
    it.each([
      {
        candidateQuery: "111 Meinglazou 29260 Lesneven",
        expectedAddress: {
          city: "Lesneven",
          departmentCode: "29",
          postcode: "29260",
          streetNumberAndAddress: "",
        },
      },
      {
        candidateQuery:
          "2 rue des Anciens Combattants d'Afrique du Nord, 54200 Toul",
        expectedAddress: {
          city: "Toul",
          departmentCode: "54",
          postcode: "54200",
          streetNumberAndAddress:
            "2 Rue des Anciens Combattants d'Afrique du Nord",
        },
      },
      {
        candidateQuery: "17 place Sainte Luce 06800 Cagnes sur Mer",
        expectedAddress: {
          city: "Cagnes-sur-Mer",
          departmentCode: "06",
          postcode: "06800",
          streetNumberAndAddress: "Place Sainte-Luce",
        },
      },
      {
        candidateQuery: "21 Rue Monthyon Saint-Denis 97400",
        expectedAddress: {
          city: "Saint-Denis",
          departmentCode: "974",
          postcode: "97400",
          streetNumberAndAddress: "Rue Monthyon",
        },
      },
      {
        candidateQuery: "69120",
        expectedAddress: {
          city: "Vaulx-en-Velin",
          departmentCode: "69",
          postcode: "69120",
          streetNumberAndAddress: "",
        },
      },
      {
        candidateQuery: "75016",
        expectedAddress: {
          city: "Paris",
          departmentCode: "75",
          postcode: "75016",
          streetNumberAndAddress: "",
        },
      },
      {
        candidateQuery: "Paris",
        expectedAddress: {
          city: "Paris",
          departmentCode: "75",
          postcode: "",
          streetNumberAndAddress: "",
        },
      },
      {
        candidateQuery: "Carcassonne",
        expectedAddress: {
          city: "Carcassonne",
          departmentCode: "11",
          postcode: "11000",
          streetNumberAndAddress: "",
        },
      },
    ])(
      "should work if searching for $candidateQuery postcode expect $expectedAddress",
      async ({
        candidateQuery,
        expectedAddress,
      }: {
        candidateQuery: string;
        expectedAddress: AddressDto;
      }) => {
        const resultMetropolitanFrance =
          await httpAddressGateway.lookupStreetAddress(candidateQuery);

        const firstResult: AddressAndPosition | undefined =
          resultMetropolitanFrance.at(0);
        expect(firstResult?.address).toEqual(expectedAddress);
      },
      10000,
    );

    it("Should return expected address DTO when providing address with special characters.", async () => {
      const resultPreviousNotFoundWithAddresseAPI =
        await httpAddressGateway.lookupStreetAddress("Route d’Huez 38750 Huez");

      expectTypeToMatchAndEqual(resultPreviousNotFoundWithAddresseAPI.at(0), {
        address: {
          city: "L'Alpe d'Huez",
          departmentCode: "38",
          postcode: "38750",
          streetNumberAndAddress: "Route d'Huez",
        },
        position: {
          lat: 45.0907535,
          lon: 6.0631237,
        },
      });
    });
    it("Should not support lookup address with only one char.", async () => {
      await expectPromiseToFailWithError(
        httpAddressGateway.lookupStreetAddress("R"),
        new Error(minimumCharErrorMessage(2)),
      );
    });
    it("Should support lookup address with two char.", async () => {
      const resultPreviousNotFoundWithAddresseAPI =
        await httpAddressGateway.lookupStreetAddress("Ro");

      expectTypeToMatchAndEqual(resultPreviousNotFoundWithAddresseAPI.at(0), {
        address: {
          city: "Rots",
          departmentCode: "14",
          postcode: "14980",
          streetNumberAndAddress: "",
        },
        position: {
          lat: 49.2062576,
          lon: -0.4775068,
        },
      });
    });
  });
  describe("lookupLocationName", () => {
    it.each([
      {
        candidateQuery: "Uzerche",
        expectedSearchResult: [
          {
            label: "Uzerche, Corrèze, France",
            position: {
              lat: 45.42433,
              lon: 1.56373,
            },
          },
        ],
      },
      {
        candidateQuery: "Paris",
        expectedSearchResult: [
          {
            label: "Paris, Île-de-France, France",
            position: {
              lat: 48.85889,
              lon: 2.32004,
            },
          },
          {
            label: "Paris 16e Arrondissement, Paris, Île-de-France, France",
            position: {
              lat: 48.86317,
              lon: 2.27576,
            },
          },
          {
            label: "Montmartre, Paris, Île-de-France, France",
            position: {
              lat: 48.88671,
              lon: 2.34157,
            },
          },
          {
            label: "Paris-l'Hôpital, Saône-et-Loire, France",
            position: {
              lat: 46.91503,
              lon: 4.63302,
            },
          },
          {
            label: "Paris 8e Arrondissement, Paris, Île-de-France, France",
            position: {
              lat: 48.87748,
              lon: 2.31765,
            },
          },
        ],
      },
      {
        candidateQuery: "75001",
        expectedSearchResult: [],
      },
      {
        candidateQuery: "Bordeaux 33000",
        expectedSearchResult: [],
      },
    ])(
      "should work if searching for $candidateQuery location query expect $expectedSearchResult",
      async ({
        candidateQuery,
        expectedSearchResult,
      }: {
        candidateQuery: string;
        expectedSearchResult: LookupSearchResult[];
      }) => {
        const resultMetropolitanFrance =
          await httpAddressGateway.lookupLocationName(candidateQuery);
        expectToEqual(resultMetropolitanFrance, expectedSearchResult);
      },
      10000,
    );
  });
  describe("findDepartmentCodeFromPostCode", () => {
    it.each([
      ["01240", "01"],
      ["02200", "02"],
      ["03200", "03"],
      ["04200", "04"],
      ["05200", "05"],
      ["06200", "06"],
      ["07200", "07"],
      ["08200", "08"],
      ["09200", "09"],
      ["10200", "10"],
      ["11200", "11"],
      ["12200", "12"],
      ["13200", "13"],
      ["14200", "14"],
      ["15200", "15"],
      ["16200", "16"],
      ["17200", "17"],
      ["18200", "18"],
      ["19200", "19"],
      ["21200", "21"],
      ["22200", "22"],
      ["23200", "23"],
      ["24200", "24"],
      ["25200", "25"],
      ["26200", "26"],
      ["27200", "27"],
      ["28200", "28"],
      ["29200", "29"],
      ["20000", "2A"],
      ["20200", "2B"],
      ["30200", "30"],
      ["31200", "31"],
      ["32200", "32"],
      ["33200", "33"],
      ["34200", "34"],
      ["35200", "35"],
      ["36200", "36"],
      ["37200", "37"],
      ["38200", "38"],
      ["39200", "39"],
      ["40200", "40"],
      ["41200", "41"],
      ["42800", "42"],
      ["43200", "43"],
      ["44200", "44"],
      ["45200", "45"],
      ["46200", "46"],
      ["47200", "47"],
      ["48200", "48"],
      ["49000", "49"],
      ["50200", "50"],
      ["51200", "51"],
      ["52200", "52"],
      ["53200", "53"],
      ["54200", "54"],
      ["55200", "55"],
      ["56200", "56"],
      ["57200", "57"],
      ["58200", "58"],
      ["59200", "59"],
      ["60200", "60"],
      ["61200", "61"],
      ["62200", "62"],
      ["63200", "63"],
      ["64160", "64"],
      ["65000", "65"],
      ["66000", "66"],
      ["67200", "67"],
      ["68200", "68"],
      ["69120", "69"],
      ["70200", "70"],
      ["71200", "71"],
      ["72200", "72"],
      ["73200", "73"],
      ["74200", "74"],
      ["75001", "75"],
      ["76200", "76"],
      ["77200", "77"],
      ["78200", "78"],
      ["79000", "79"],
      ["80200", "80"],
      ["81200", "81"],
      ["82200", "82"],
      ["83200", "83"],
      ["84200", "84"],
      ["85200", "85"],
      ["86200", "86"],
      ["87200", "87"],
      ["88200", "88"],
      ["89200", "89"],
      ["90000", "90"],
      ["91200", "91"],
      ["92200", "92"],
      ["93200", "93"],
      ["94200", "94"],
      ["95200", "95"],
      ["97120", "971"],
      ["97200", "972"],
      ["97300", "973"],
      ["97400", "974"],
      ["97600", "976"],
      ["69210", "69"],
      ["69530", "69"],
      ["69530", "69"],
      ["69120", "69"],
      ["69970", "69"],
      ["86000", "86"],
      ["01590", "39"],
      ["20137", "2A"],
      ["29120", "29"],
    ])(
      "findDepartmentCodeFromPostCode: postal code %s should return %s",
      async (postcode: string, expected: string) => {
        const result = await httpAddressGateway.findDepartmentCodeFromPostCode(
          postcode,
        );
        expectTypeToMatchAndEqual(result, expected);
      },
      5000,
    );

    it("findDepartmentCodeFromPostCode : should return department code from existing postcode", async () => {
      const result = await httpAddressGateway.findDepartmentCodeFromPostCode(
        "06500",
      );
      expectTypeToMatchAndEqual(result, "06");
    }, 5000);
  });
});

describe("HttpOpenCageDataAddressGateway check parrarel call", () => {
  const parallelCalls = 10;
  it(`Should support ${parallelCalls} of parallel calls`, async () => {
    const httpAddressGateway: AddressGateway =
      new HttpOpenCageDataAddressGateway(
        createHttpOpenCageDataClient<OpenCageDataTargets>(openCageDataTargets),
        httpAdresseApiClient,
        geocodingApiKey,
        geosearchApiKey,
      );

    const coordinates: GeoPositionDto[] = [];
    const expectedResults: AddressDto[] = [];

    for (let index = 0; index < parallelCalls; index++) {
      coordinates.push({
        lat: resultFromApiAddress.features[0].position.coordinates[1],
        lon: resultFromApiAddress.features[0].position.coordinates[0],
      });
      expectedResults.push({
        streetNumberAndAddress: "Rue Gaston Romazzotti",
        city: "Molsheim",
        departmentCode: "67",
        postcode: "67120",
      });
    }
    const results: (AddressDto | undefined)[] = await Promise.all(
      coordinates.map((coordinate) =>
        httpAddressGateway.getAddressFromPosition(coordinate),
      ),
    );

    expectTypeToMatchAndEqual(results, expectedResults);
  }, 15000);
});
