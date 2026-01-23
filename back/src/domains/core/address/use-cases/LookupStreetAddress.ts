import {
  type AddressWithCountryCodeAndPosition,
  type WithLookupAddressQueryParams,
  withLookupStreetAddressQueryParamsSchema,
} from "shared";
import { useCaseBuilder } from "../../useCaseBuilder";
import type { AddressGateway } from "../ports/AddressGateway";

export type LookupStreetAddress = ReturnType<typeof makeLookupStreetAddress>;

export const makeLookupStreetAddress = useCaseBuilder("LookupStreetAddress")
  .notTransactional()
  .withInput<WithLookupAddressQueryParams>(
    withLookupStreetAddressQueryParamsSchema,
  )
  .withOutput<AddressWithCountryCodeAndPosition[]>()
  .withDeps<{ addressGateway: AddressGateway }>()
  .build(async ({ inputParams, deps }) =>
    deps.addressGateway.lookupStreetAddress(
      inputParams.lookup,
      inputParams.countryCode,
    ),
  );
