import {
  AddressRoutes,
  addressRoutes,
  expectHttpResponseToEqual,
  LookupAddress,
  LookupLocationInput,
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

const lookupAddressQueryParam = "lookup";
const lookupLocationQueryParam = "query";

const lookupStreetAddressUrl = (lookup: LookupAddress): string =>
  `${addressRoutes.lookupStreetAddress.url}?${lookupAddressQueryParam}=${lookup}`;

const lookupLocationUrl = (lookupLocationInput: LookupLocationInput): string =>
  `${addressRoutes.lookupLocation.url}?${lookupLocationQueryParam}=${lookupLocationInput}`;

describe("addressRouter", () => {
  let httpClient: HttpClient<AddressRoutes>;
  let addressGateway: InMemoryAddressGateway;

  beforeEach(async () => {
    const { request, gateways } = await buildTestApp();
    httpClient = createSupertestSharedClient(addressRoutes, request);
    addressGateway = gateways.addressApi;
  });

  describe(`${addressRoutes.lookupStreetAddress.url} route`, () => {
    it(`GET 200 ${lookupStreetAddressUrl(query8bdduportLookup)}`, async () => {
      addressGateway.setAddressAndPosition(
        expected8bdduportAddressAndPositions,
      );
      const response = await httpClient.lookupStreetAddress({
        queryParams: {
          lookup: query8bdduportLookup,
        },
      });
      expect(response.body).toEqual(expected8bdduportAddressAndPositions);
      expect(response.status).toBe(200);
    });

    describe("bad queries", () => {
      it(`GET 400 '${lookupStreetAddressUrl("1")}'`, async () => {
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

      it(`GET 400 '${lookupStreetAddressUrl(
        "a a a a a a a a a a a a a a a a a a a",
      )}'`, async () => {
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
        `GET 400 '${lookupStreetAddressUrl("%s")}'`,
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
  });

  describe(`${addressRoutes.lookupLocation.url} route`, () => {
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
      const response = await httpClient.lookupLocation({
        queryParams: {
          query: exampleQuery,
        },
      });
      expect(response.body).toEqual(expectedLookupSearchResults);
      expect(response.status).toBe(200);
    });
  });
});
