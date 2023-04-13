import { z } from "zod";

import { DepartmentCode } from "./address.dto";
import { departmentCodeSchema } from "./address.schema";

export type FindDepartmentCodeFromPostcodeResponse = {
  departmentCode: DepartmentCode | null;
};
export const findDepartmentCodeFromPostcodeResponseSchema: z.Schema<FindDepartmentCodeFromPostcodeResponse> =
  z.object({
    departmentCode: departmentCodeSchema,
  });
