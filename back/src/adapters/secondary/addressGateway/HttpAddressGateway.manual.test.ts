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
import { configureCreateHttpClientForExternalApi } from "../../primary/config/createHttpClientForExternalApi";
import { errorMessage, HttpAddressGateway } from "./HttpAddressGateway";
import { addressesExternalTargets } from "./HttpAddressGateway.targets";

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
    httpAddressGateway = new HttpAddressGateway(
      configureCreateHttpClientForExternalApi()(addressesExternalTargets),
      geocodingApiKey,
      geosearchApiKey,
    );
  });

  describe("lookupStreetAddress, postcode is now mandatory", () => {
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
        candidateQuery: "Avenue des Champs élyssés Paris",
        expectedAddress: {
          city: "Paris 8e Arrondissement",
          departmentCode: "75",
          postcode: "75008",
          streetNumberAndAddress: "Avenue des Champs-Élysées",
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
      "Should work if searching for '$candidateQuery' postcode expect '$expectedAddress'.",
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
        new Error(errorMessage.minimumCharErrorMessage(2)),
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
            label: "Uzerche, Nouvelle-Aquitaine, France",
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
              lat: 48.8535,
              lon: 2.34839,
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
            label: "Paris-l'Hôpital, Bourgogne-Franche-Comté, France",
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
          {
            label: "Paris 15e Arrondissement, Paris, Île-de-France, France",
            position: {
              lat: 48.84137,
              lon: 2.30038,
            },
          },
          {
            label: "Paris 7e Arrondissement, Paris, Île-de-France, France",
            position: {
              lat: 48.85703,
              lon: 2.3202,
            },
          },
          {
            label: "Paris 6e Arrondissement, Paris, Île-de-France, France",
            position: {
              lat: 48.85043,
              lon: 2.33295,
            },
          },
          {
            label: "Paris 9e Arrondissement, Paris, Île-de-France, France",
            position: {
              lat: 48.87602,
              lon: 2.33996,
            },
          },
          {
            label: "Paris 14e Arrondissement, Paris, Île-de-France, France",
            position: {
              lat: 48.82957,
              lon: 2.32396,
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
      {
        candidateQuery: "bar",
        expectedSearchResult: [
          {
            label: "Baralle, Hauts-de-France, France",
            position: {
              lat: 50.21132,
              lon: 3.05763,
            },
          },
          {
            label: "Barastre, Hauts-de-France, France",
            position: {
              lat: 50.07605,
              lon: 2.93402,
            },
          },
          {
            label: "Barly, Hauts-de-France, France",
            position: {
              lat: 50.25129,
              lon: 2.54786,
            },
          },
          {
            label: "Barlin, Hauts-de-France, France",
            position: {
              lat: 50.45684,
              lon: 2.61748,
            },
          },
          {
            label: "Bar-le-Duc, Meuse, France",
            position: {
              lat: 48.77127,
              lon: 5.16238,
            },
          },
          {
            label: "Barenton-sur-Serre, Hauts-de-France, France",
            position: {
              lat: 49.66996,
              lon: 3.68137,
            },
          },
          {
            label: "Barenton-Bugny, Hauts-de-France, France",
            position: {
              lat: 49.6335,
              lon: 3.6524,
            },
          },
          {
            label: "Barenton-Cel, Hauts-de-France, France",
            position: {
              lat: 49.6425,
              lon: 3.6536,
            },
          },
          {
            label: "Barzy-en-Thiérache, Hauts-de-France, France",
            position: {
              lat: 50.04389,
              lon: 3.74694,
            },
          },
          {
            label: "Barzy-sur-Marne, Hauts-de-France, France",
            position: {
              lat: 49.08648,
              lon: 3.55282,
            },
          },
        ],
      },
    ])(
      "Should work if searching for '$candidateQuery' location query expect '$expectedSearchResult.length' results.",
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
});

describe("HttpOpenCageDataAddressGateway check parrarel call", () => {
  const parallelCalls = 10;
  it(`Should support ${parallelCalls} of /getAddressFromPosition parallel calls`, async () => {
    const httpAddressGateway: AddressGateway = new HttpAddressGateway(
      configureCreateHttpClientForExternalApi()(addressesExternalTargets),
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
        streetNumberAndAddress: "14 Rue Gaston Romazzotti",
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
