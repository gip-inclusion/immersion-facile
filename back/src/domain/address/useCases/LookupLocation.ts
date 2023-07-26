import {
  ConventionMagicLinkPayload,
  LookupSearchResult,
  WithLookupLocationInputQueryParams,
  withLookupLocationInputQueryParamsSchema,
} from "shared";
import { UseCase } from "../../core/UseCase";
import { AddressGateway } from "../../immersionOffer/ports/AddressGateway";

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
    _jwtPayload?: ConventionMagicLinkPayload | undefined,
  ): Promise<LookupSearchResult[]> {
    return this.addressApiGateway.lookupLocationName(params.query);
  }
}
