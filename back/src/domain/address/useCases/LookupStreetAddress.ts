import {
  AddressAndPosition,
  ConventionMagicLinkPayload,
  WithLookupAddressQueryParams,
  withLookupStreetAddressQueryParamsSchema,
} from "shared";
import { UseCase } from "../../core/UseCase";
import { AddressGateway } from "../../immersionOffer/ports/AddressGateway";

export class LookupStreetAddress extends UseCase<
  WithLookupAddressQueryParams,
  AddressAndPosition[]
> {
  protected inputSchema = withLookupStreetAddressQueryParamsSchema;

  constructor(private addressApiGateway: AddressGateway) {
    super();
  }

  protected _execute(
    params: WithLookupAddressQueryParams,
    _jwtPayload?: ConventionMagicLinkPayload | undefined,
  ): Promise<AddressAndPosition[]> {
    return this.addressApiGateway.lookupStreetAddress(params.lookup);
  }
}
