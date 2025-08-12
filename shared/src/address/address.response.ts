import { z } from "zod";
import type { ZodSchemaWithInputMatchingOutput } from "../zodUtils";
import type { DepartmentCode } from "./address.dto";
import { departmentCodeSchema } from "./address.schema";

export type FindDepartmentCodeFromPostcodeResponse = {
  departmentCode: DepartmentCode | null;
};
export const findDepartmentCodeFromPostcodeResponseSchema: ZodSchemaWithInputMatchingOutput<FindDepartmentCodeFromPostcodeResponse> =
  z.object({
    departmentCode: departmentCodeSchema,
  });
