import {
  ConventionMagicLinkPayload,
  DepartmentCodeFromPostcodeQuery,
  departmentCodeFromPostcodeQuerySchema,
  FindDepartmentCodeFromPostcodeResponse,
} from "shared";
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
