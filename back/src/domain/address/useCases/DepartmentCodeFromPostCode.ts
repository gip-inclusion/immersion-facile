import {
  DepartmentCodeFromPostcodeQuery,
  departmentCodeFromPostcodeQuerySchema,
} from "shared/src/address/address.query";
import { FindDepartmentCodeFromPostcodeResponse } from "shared/src/address/address.response";
import { ConventionMagicLinkPayload } from "shared/src/tokens/MagicLinkPayload";
import { ZodType, ZodTypeDef } from "zod";
import { UseCase } from "../../core/UseCase";
import { AddressGateway } from "../../immersionOffer/ports/AddressGateway";

export class DepartmentCodeFromPostcode extends UseCase<
  DepartmentCodeFromPostcodeQuery,
  FindDepartmentCodeFromPostcodeResponse
> {
  constructor(private apiAddressGateway: AddressGateway) {
    super();
  }

  protected inputSchema: ZodType<
    DepartmentCodeFromPostcodeQuery,
    ZodTypeDef,
    DepartmentCodeFromPostcodeQuery
  > = departmentCodeFromPostcodeQuerySchema;

  protected async _execute(
    params: DepartmentCodeFromPostcodeQuery,
    _jwtPayload?: ConventionMagicLinkPayload | undefined,
  ): Promise<FindDepartmentCodeFromPostcodeResponse> {
    const departmentCode =
      await this.apiAddressGateway.findDepartmentCodeFromPostCode(
        this.inputSchema.parse(params),
      );
    return {
      departmentCode,
    };
  }
}
