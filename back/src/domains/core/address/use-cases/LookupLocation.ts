import {
  type ConventionJwtPayload,
  type LookupSearchResult,
  type WithLookupLocationInputQueryParams,
  withLookupLocationInputQueryParamsSchema,
} from "shared";
import { UseCase } from "../../UseCase";
import type { AddressGateway } from "../ports/AddressGateway";

export class LookupLocation extends UseCase<
  WithLookupLocationInputQueryParams,
  LookupSearchResult[]
> {
  protected inputSchema = withLookupLocationInputQueryParamsSchema;

  constructor(private addressApiGateway: AddressGateway) {
    super();
  }

  protected _execute(
    params: WithLookupLocationInputQueryParams,
    _jwtPayload?: ConventionJwtPayload | undefined,
  ): Promise<LookupSearchResult[]> {
    return this.addressApiGateway.lookupLocationName(params.query);
  }
}
