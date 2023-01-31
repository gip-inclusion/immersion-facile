import {
  ConventionMagicLinkPayload,
  lookupLocationInputSchema,
  LookupSearchResult,
  WithLookupLocationInput,
} from "shared";
import { ZodType, ZodTypeDef } from "zod";
import { UseCase } from "../../core/UseCase";
import { AddressGateway } from "../../immersionOffer/ports/AddressGateway";

export class LookupLocation extends UseCase<
  WithLookupLocationInput,
  LookupSearchResult[]
> {
  constructor(private addressApiGateway: AddressGateway) {
    super();
  }
  protected inputSchema: ZodType<
    WithLookupLocationInput,
    ZodTypeDef,
    WithLookupLocationInput
  > = lookupLocationInputSchema;

  protected _execute(
    params: WithLookupLocationInput,
    _jwtPayload?: ConventionMagicLinkPayload | undefined,
  ): Promise<LookupSearchResult[]> {
    return this.addressApiGateway.lookupLocationName(params.query);
  }
}
