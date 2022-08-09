import { AddressDto } from "shared/src/address/address.dto";
import { GeoPositionDto } from "shared/src/geoPosition/geoPosition.dto";
import { RealClock } from "../../adapters/secondary/core/ClockImplementations";
import {
  apiAddressRateLimiter,
  HttpAddressAPI,
  httpAddressApiClient,
} from "../../adapters/secondary/immersionOffer/HttpAddressAPI";
import { noRetries } from "../../domain/core/ports/RetryStrategy";
import { expectTypeToMatchAndEqual } from "../../_testBuilders/test.helpers";

const resultFromApiAddress = {
  type: "FeatureCollection",
  version: "draft",
  features: [
    {
      type: "Feature",
      geometry: {
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
        distance: 6,
      },
    },
  ],
  attribution: "BAN",
  licence: "ETALAB-2.0",
  limit: 1,
};

describe("HttpAddressAPI", () => {
  let adapter: HttpAddressAPI;

  beforeEach(() => {
    adapter = new HttpAddressAPI(
      httpAddressApiClient,
      apiAddressRateLimiter(new RealClock()),
      noRetries,
    );
  });

  it("Should return expected address DTO when providing accurate position.", async () => {
    const result = await adapter.getAddressFromPosition({
      lat: resultFromApiAddress.features[0].geometry.coordinates[1],
      lon: resultFromApiAddress.features[0].geometry.coordinates[0],
    });

    expectTypeToMatchAndEqual(result, {
      streetNumberAndAddress: "14 Rue Gaston Romazzotti",
      city: "Molsheim",
      departmentCode: "67",
      postcode: "67120",
    });
  }, 5000);

  it("BugFix - should return expected address DTO when providing a position that don't have geoJson street and house number", async () => {
    const result = await adapter.getAddressFromPosition({
      lat: 43.791521,
      lon: 7.500604,
    });

    expectTypeToMatchAndEqual(result, {
      streetNumberAndAddress: "Menton",
      city: "Menton",
      departmentCode: "06",
      postcode: "06500",
    });
  }, 5000);

  const parallelCalls = 200;
  it(`Should support ${parallelCalls} of parallel calls`, async () => {
    const coordinates: GeoPositionDto[] = [];
    const expectedResults: AddressDto[] = [];

    for (let index = 0; index < parallelCalls; index++) {
      coordinates.push({
        lat: resultFromApiAddress.features[0].geometry.coordinates[1],
        lon: resultFromApiAddress.features[0].geometry.coordinates[0],
      });
      expectedResults.push({
        streetNumberAndAddress: "14 Rue Gaston Romazzotti",
        city: "Molsheim",
        departmentCode: "67",
        postcode: "67120",
      });
    }
    const results: (AddressDto | undefined)[] = [];
    for (const coordinate of coordinates)
      results.push(await adapter.getAddressFromPosition(coordinate));

    expectTypeToMatchAndEqual(results, expectedResults);
  }, 30000);
});
