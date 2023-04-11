import {
  AddressAndPosition,
  ConventionMagicLinkPayload,
  withLookupStreetAddressQueryParamsSchema,
  WithLookupStreetAddressQueryParams,
} from "shared";
import { UseCase } from "../../core/UseCase";
import { AddressGateway } from "../../immersionOffer/ports/AddressGateway";

export class LookupStreetAddress extends UseCase<
  WithLookupStreetAddressQueryParams,
  AddressAndPosition[]
> {
  constructor(private addressApiGateway: AddressGateway) {
    super();
  }
  protected inputSchema = withLookupStreetAddressQueryParamsSchema;

  protected _execute(
    params: WithLookupStreetAddressQueryParams,
    _jwtPayload?: ConventionMagicLinkPayload | undefined,
  ): Promise<AddressAndPosition[]> {
    return this.addressApiGateway.lookupStreetAddress(params.lookup);
  }
}
