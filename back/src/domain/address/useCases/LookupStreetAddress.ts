import {
  AddressAndPosition,
  ConventionMagicLinkPayload,
  withLookupStreetAddressQueryParamsSchema,
  WithLookupAddressQueryParams,
} from "shared";
import { UseCase } from "../../core/UseCase";
import { AddressGateway } from "../../immersionOffer/ports/AddressGateway";

export class LookupStreetAddress extends UseCase<
  WithLookupAddressQueryParams,
  AddressAndPosition[]
> {
  constructor(private addressApiGateway: AddressGateway) {
    super();
  }
  protected inputSchema = withLookupStreetAddressQueryParamsSchema;

  protected _execute(
    params: WithLookupAddressQueryParams,
    _jwtPayload?: ConventionMagicLinkPayload | undefined,
  ): Promise<AddressAndPosition[]> {
    return this.addressApiGateway.lookupStreetAddress(params.lookup);
  }
}
