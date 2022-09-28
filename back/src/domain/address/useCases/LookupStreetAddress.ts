import { AddressAndPosition, LookupAddress } from "shared";
import { lookupAddressSchema } from "shared";
import { ConventionMagicLinkPayload } from "shared";
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
