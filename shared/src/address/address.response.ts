import { z } from "zod/v4";
import type { DepartmentCode } from "./address.dto";
import { departmentCodeSchema } from "./address.schema";

export type FindDepartmentCodeFromPostcodeResponse = {
  departmentCode: DepartmentCode | null;
};
export const findDepartmentCodeFromPostcodeResponseSchema: z.Schema<FindDepartmentCodeFromPostcodeResponse> =
  z.object({
    departmentCode: departmentCodeSchema,
  });
