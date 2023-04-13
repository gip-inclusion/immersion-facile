import { createTarget, createTargets } from "http-client";

import {
  addressAndPositionListSchema,
  lookupSearchResultsSchema,
  withLookupLocationInputQueryParamsSchema,
  withLookupStreetAddressQueryParamsSchema,
} from "../address/address.schema";

export type AddressTargets = typeof addressTargets;
export const addressTargets = createTargets({
  lookupLocation: createTarget({
    method: "GET",
    url: "/address/lookup-location",
    validateQueryParams: withLookupLocationInputQueryParamsSchema.parse,
    validateResponseBody: lookupSearchResultsSchema.parse,
  }),
  lookupStreetAddress: createTarget({
    method: "GET",
    url: "/address/lookupStreetAddress",
    validateQueryParams: withLookupStreetAddressQueryParamsSchema.parse,
    validateResponseBody: addressAndPositionListSchema.parse,
  }),
});
