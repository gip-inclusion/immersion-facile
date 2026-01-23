import {
  type LookupSearchResult,
  type WithLookupLocationInputQueryParams,
  withLookupLocationInputQueryParamsSchema,
} from "shared";
import { useCaseBuilder } from "../../useCaseBuilder";
import type { AddressGateway } from "../ports/AddressGateway";

export type LookupLocation = ReturnType<typeof makeLookupLocation>;

export const makeLookupLocation = useCaseBuilder("LookupLocation")
  .notTransactional()
  .withInput<WithLookupLocationInputQueryParams>(
    withLookupLocationInputQueryParamsSchema,
  )
  .withOutput<LookupSearchResult[]>()
  .withDeps<{ addressGateway: AddressGateway }>()
  .build(async ({ inputParams, deps }) =>
    deps.addressGateway.lookupLocationName(inputParams.query),
  );
