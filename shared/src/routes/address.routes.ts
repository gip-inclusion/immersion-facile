import { defineRoute, defineRoutes } from "shared-routes";
import {
  addressWithCountryCodeAndPositionListSchema,
  lookupSearchResultsSchema,
  withLookupLocationInputQueryParamsSchema,
  withLookupStreetAddressQueryParamsSchema,
} from "../address/address.schema";
import { httpErrorSchema } from "../httpClient/httpErrors.schema";

export type AddressRoutes = typeof addressRoutes;
export const addressRoutes = defineRoutes({
  lookupLocation: defineRoute({
    method: "get",
    url: "/address/lookup-location",
    queryParamsSchema: withLookupLocationInputQueryParamsSchema,
    responses: {
      200: lookupSearchResultsSchema,
    },
  }),
  lookupStreetAddress: defineRoute({
    method: "get",
    url: "/address/lookupStreetAddress",
    queryParamsSchema: withLookupStreetAddressQueryParamsSchema,
    responses: {
      200: addressWithCountryCodeAndPositionListSchema,
      400: httpErrorSchema,
    },
  }),
});
