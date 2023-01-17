import {
  departmentCodeFromPostcodeRoute,
  departmentCodeFromPostcodeUrl,
  lookupLocationRoute,
  lookupLocationUrl,
  LookupSearchResult,
  lookupStreetAddressRoute,
  lookupStreetAddressUrl,
} from "shared";
import { SuperTest, Test } from "supertest";
import { buildTestApp } from "../../../../_testBuilders/buildTestApp";
import { InMemoryAddressGateway } from "../../../secondary/addressGateway/InMemoryAddressGateway";
import {
  expected8bdduportAddressAndPositions,
  query8bdduportLookup,
} from "../../../secondary/addressGateway/testUtils";

describe("addressRouter", () => {
  let request: SuperTest<Test>;
  let addressGateway: InMemoryAddressGateway;

  beforeEach(async () => {
    const testAppAndDeps = await buildTestApp();
    request = testAppAndDeps.request;
    addressGateway = testAppAndDeps.gateways.addressApi;
  });

  describe(`${lookupStreetAddressRoute} route`, () => {
    it(`GET ${lookupStreetAddressUrl(query8bdduportLookup)}`, async () => {
      addressGateway.setAddressAndPosition(
        expected8bdduportAddressAndPositions,
      );
      const response = await request.get(
        lookupStreetAddressUrl(query8bdduportLookup),
      );
      expect(response.body).toEqual(expected8bdduportAddressAndPositions);
      expect(response.status).toBe(200);
    });
  });

  describe(`${lookupLocationRoute} route`, () => {
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

  describe(`${departmentCodeFromPostcodeRoute} route`, () => {
    it(`GET ${departmentCodeFromPostcodeUrl("75001")}`, async () => {
      addressGateway.setDepartmentCode("75");
      const response = await request.get(
        departmentCodeFromPostcodeUrl("75001"),
      );
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        departmentCode: "75",
      });
    });
  });
});
