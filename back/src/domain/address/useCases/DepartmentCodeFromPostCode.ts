import {
  ConventionMagicLinkPayload,
  departmentCodeFromPostcodeQuerySchema,
  FindDepartmentCodeFromPostcodeResponse,
  WithDepartmentCodeFromPostcodeQuery,
} from "shared";
import { ZodType, ZodTypeDef } from "zod";
import { UseCase } from "../../core/UseCase";
import { AddressGateway } from "../../immersionOffer/ports/AddressGateway";

export class DepartmentCodeFromPostcode extends UseCase<
  WithDepartmentCodeFromPostcodeQuery,
  FindDepartmentCodeFromPostcodeResponse
> {
  constructor(private apiAddressGateway: AddressGateway) {
    super();
  }

  protected inputSchema: ZodType<
    WithDepartmentCodeFromPostcodeQuery,
    ZodTypeDef,
    WithDepartmentCodeFromPostcodeQuery
  > = departmentCodeFromPostcodeQuerySchema;

  protected async _execute(
    params: WithDepartmentCodeFromPostcodeQuery,
    _jwtPayload?: ConventionMagicLinkPayload | undefined,
  ): Promise<FindDepartmentCodeFromPostcodeResponse> {
    const departmentCode =
      await this.apiAddressGateway.findDepartmentCodeFromPostCode(
        params.postcode,
      );
    return {
      departmentCode,
    };
  }
}
