import { SuperTest, Test } from "supertest";
import {
  addressTargets,
  LookupAddress,
  LookupLocationInput,
  LookupSearchResult,
} from "shared";
import { buildTestApp } from "../../../../_testBuilders/buildTestApp";
import { InMemoryAddressGateway } from "../../../secondary/addressGateway/InMemoryAddressGateway";
import {
  expected8bdduportAddressAndPositions,
  query8bdduportLookup,
} from "../../../secondary/addressGateway/testUtils";

const lookupAddressQueryParam = "lookup";
const lookupLocationQueryParam = "query";

const lookupStreetAddressUrl = (lookup: LookupAddress): string =>
  `${addressTargets.lookupStreetAddress.url}?${lookupAddressQueryParam}=${lookup}`;

const lookupLocationUrl = (lookupLocationInput: LookupLocationInput): string =>
  `${addressTargets.lookupLocation.url}?${lookupLocationQueryParam}=${lookupLocationInput}`;

describe("addressRouter", () => {
  let request: SuperTest<Test>;
  let addressGateway: InMemoryAddressGateway;

  beforeEach(async () => {
    const testAppAndDeps = await buildTestApp();
    request = testAppAndDeps.request;
    addressGateway = testAppAndDeps.gateways.addressApi;
  });

  describe(`${addressTargets.lookupStreetAddress.url} route`, () => {
    it(`GET ${lookupStreetAddressUrl(query8bdduportLookup)}`, async () => {
      addressGateway.setAddressAndPosition(
        expected8bdduportAddressAndPositions,
      );
      const response = await request.get(
        `${addressTargets.lookupStreetAddress.url}?${lookupAddressQueryParam}=${query8bdduportLookup}`,
      );
      expect(response.body).toEqual(expected8bdduportAddressAndPositions);
      expect(response.status).toBe(200);
    });
  });

  describe(`${addressTargets.lookupLocation.url} route`, () => {
    const exampleQuery = "Saint-Emil";
    const expectedLookupSearchResults: LookupSearchResult[] = [
      {
        label: "Saint-Emilion",
        position: {
          lat: 23,
          lon: 12,
        },
      },
    ];
    it(`GET ${lookupLocationUrl(exampleQuery)}`, async () => {
      addressGateway.setLookupSearchResults(expectedLookupSearchResults);
      const response = await request.get(lookupLocationUrl(exampleQuery));
      expect(response.body).toEqual(expectedLookupSearchResults);
      expect(response.status).toBe(200);
    });
  });
});
