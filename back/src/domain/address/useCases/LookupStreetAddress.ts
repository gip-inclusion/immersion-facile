import {
  AddressAndPosition,
  LookupAddress,
} from "shared/src/address/address.dto";
import { lookupAddressSchema } from "shared/src/address/lookupAddress.schema";
import { ConventionMagicLinkPayload } from "shared/src/tokens/MagicLinkPayload";
import { ZodType, ZodTypeDef } from "zod";
import { UseCase } from "../../core/UseCase";
import { AddressGateway } from "../../immersionOffer/ports/AddressGateway";

export class LookupStreetAddress extends UseCase<
  LookupAddress,
  AddressAndPosition[]
> {
  constructor(private addressApiGateway: AddressGateway) {
    super();
  }
  protected inputSchema: ZodType<LookupAddress, ZodTypeDef, LookupAddress> =
    lookupAddressSchema;

  protected _execute(
    params: LookupAddress,
    _jwtPayload?: ConventionMagicLinkPayload | undefined,
  ): Promise<AddressAndPosition[]> {
    return this.addressApiGateway.lookupStreetAddress(
      this.inputSchema.parse(params),
    );
  }
}
