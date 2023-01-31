import {
  AddressAndPosition,
  ConventionMagicLinkPayload,
  lookupAddressSchema,
  WithLookupAddress,
} from "shared";
import { ZodType, ZodTypeDef } from "zod";
import { UseCase } from "../../core/UseCase";
import { AddressGateway } from "../../immersionOffer/ports/AddressGateway";

export class LookupStreetAddress extends UseCase<
  WithLookupAddress,
  AddressAndPosition[]
> {
  constructor(private addressApiGateway: AddressGateway) {
    super();
  }
  protected inputSchema: ZodType<
    WithLookupAddress,
    ZodTypeDef,
    WithLookupAddress
  > = lookupAddressSchema;

  protected _execute(
    params: WithLookupAddress,
    _jwtPayload?: ConventionMagicLinkPayload | undefined,
  ): Promise<AddressAndPosition[]> {
    return this.addressApiGateway.lookupStreetAddress(params.lookup);
  }
}
