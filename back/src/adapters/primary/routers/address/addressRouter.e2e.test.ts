import {
  AddressRoutes,
  addressRoutes,
  displayRouteName,
  expectHttpResponseToEqual,
  LookupSearchResult,
} from "shared";
import { HttpClient } from "shared-routes";
import { createSupertestSharedClient } from "shared-routes/supertest";
import { buildTestApp } from "../../../../_testBuilders/buildTestApp";
import { InMemoryAddressGateway } from "../../../secondary/addressGateway/InMemoryAddressGateway";
import {
  expected8bdduportAddressAndPositions,
  query8bdduportLookup,
} from "../../../secondary/addressGateway/testUtils";

describe("address router", () => {
  let httpClient: HttpClient<AddressRoutes>;
  let addressGateway: InMemoryAddressGateway;

  beforeEach(async () => {
    const { request, gateways } = await buildTestApp();
    httpClient = createSupertestSharedClient(addressRoutes, request);
    addressGateway = gateways.addressApi;
  });

  describe(`GET /address/lookupStreetAddress`, () => {
    it(`${displayRouteName(
      addressRoutes.lookupStreetAddress,
    )} 200 with lookup="${query8bdduportLookup}"`, async () => {
      addressGateway.setAddressAndPosition(
        expected8bdduportAddressAndPositions,
      );
      const response = await httpClient.lookupStreetAddress({
        queryParams: {
          lookup: query8bdduportLookup,
        },
      });
      expectHttpResponseToEqual(response, {
        body: expected8bdduportAddressAndPositions,
        status: 200,
      });
    });

    it(`${displayRouteName(
      addressRoutes.lookupStreetAddress,
    )} 400 with lookup="1"`, async () => {
      const response = await httpClient.lookupStreetAddress({
        queryParams: {
          lookup: "1",
        },
      });
      expectHttpResponseToEqual(response, {
        status: 400,
        body: {
          issues: [
            "lookup : String must contain at least 2 character(s)",
            "lookup : String must contain at least 2 character(s), excluding special chars",
          ],
          message: `Shared-route schema 'queryParamsSchema' was not respected in adapter 'express'.\nRoute: GET /address/lookupStreetAddress`,
          status: 400,
        },
      });
    });

    it(`${displayRouteName(
      addressRoutes.lookupStreetAddress,
    )} 400 with lookup="a a a a a a a a a a a a a a a a a a a"`, async () => {
      const response = await httpClient.lookupStreetAddress({
        queryParams: {
          lookup: "a a a a a a a a a a a a a a a a a a a",
        },
      });
      expectHttpResponseToEqual(response, {
        status: 400,
        body: {
          issues: ["lookup : String must contain a maximum of 18 words"],
          message: `Shared-route schema 'queryParamsSchema' was not respected in adapter 'express'.\nRoute: GET /address/lookupStreetAddress`,
          status: 400,
        },
      });
    });

    it.each(["1,", "1, ", "⠀  , a ", " )),$,#                  "])(
      `${displayRouteName(
        addressRoutes.lookupStreetAddress,
      )} 400 with lookup="%s"`,
      async (lookup) => {
        const response = await httpClient.lookupStreetAddress({
          queryParams: {
            lookup,
          },
        });

        expectHttpResponseToEqual(response, {
          status: 400,
          body: {
            issues: [
              "lookup : String must contain at least 2 character(s), excluding special chars",
            ],
            message: `Shared-route schema 'queryParamsSchema' was not respected in adapter 'express'.\nRoute: GET /address/lookupStreetAddress`,
            status: 400,
          },
        });
      },
    );
  });

  describe(`GET /address/lookup-location`, () => {
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

    it(`${displayRouteName(
      addressRoutes.lookupLocation,
    )} 200 with query=exampleQuery`, async () => {
      addressGateway.setLookupSearchResults(expectedLookupSearchResults);
      const response = await httpClient.lookupLocation({
        queryParams: {
          query: exampleQuery,
        },
      });
      expectHttpResponseToEqual(response, {
        body: expectedLookupSearchResults,
        status: 200,
      });
    });
  });
});
