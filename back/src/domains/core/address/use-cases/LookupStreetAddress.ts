import {
  type AddressWithCountryCodeAndPosition,
  type ConventionJwtPayload,
  type WithLookupAddressQueryParams,
  withLookupStreetAddressQueryParamsSchema,
} from "shared";
import { UseCase } from "../../UseCase";
import type { AddressGateway } from "../ports/AddressGateway";

export class LookupStreetAddress extends UseCase<
  WithLookupAddressQueryParams,
  AddressWithCountryCodeAndPosition[]
> {
  protected inputSchema = withLookupStreetAddressQueryParamsSchema;

  constructor(private addressApiGateway: AddressGateway) {
    super();
  }

  protected _execute(
    params: WithLookupAddressQueryParams,
    _jwtPayload?: ConventionJwtPayload | undefined,
  ): Promise<AddressWithCountryCodeAndPosition[]> {
    return this.addressApiGateway.lookupStreetAddress(
      params.lookup,
      params.countryCode,
    );
  }
}
