import {
  ConventionMagicLinkPayload,
  LookupLocationInput,
  LookupSearchResult,
  lookupLocationInputSchema,
} from "shared";
import { ZodType, ZodTypeDef } from "zod";
import { UseCase } from "../../core/UseCase";
import { AddressGateway } from "../../immersionOffer/ports/AddressGateway";

export class LookupLocation extends UseCase<
  LookupLocationInput,
  LookupSearchResult[]
> {
  constructor(private addressApiGateway: AddressGateway) {
    super();
  }
  protected inputSchema: ZodType<
    LookupLocationInput,
    ZodTypeDef,
    LookupLocationInput
  > = lookupLocationInputSchema;

  protected _execute(
    params: LookupLocationInput,
    _jwtPayload?: ConventionMagicLinkPayload | undefined,
  ): Promise<LookupSearchResult[]> {
    return this.addressApiGateway.lookupLocationName(
      this.inputSchema.parse(params),
    );
  }
}
