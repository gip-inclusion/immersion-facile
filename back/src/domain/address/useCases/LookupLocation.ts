import {
  ConventionJwtPayload,
  LookupSearchResult,
  WithLookupLocationInputQueryParams,
  withLookupLocationInputQueryParamsSchema,
} from "shared";
import { UseCase } from "../../core/UseCase";
import { AddressGateway } from "../../offer/ports/AddressGateway";

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
