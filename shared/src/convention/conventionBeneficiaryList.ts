import z from "zod";
import { businessNameSchema } from "../establishment/businessComponents.schema";
import type {
  BusinessName,
  BusinessNameCustomized,
} from "../establishment/establishment.dto";
import type { DateString } from "../utils/date";
import type { ZodSchemaWithInputMatchingOutput } from "../zodUtils";
import type {
  ConventionAssessmentFields,
  ConventionId,
  ConventionStatus,
} from "./convention.dto";
import {
  conventionAssessmentFieldsSchema,
  conventionDateEndSchema,
  conventionDateStartSchema,
  conventionIdSchema,
  conventionStatusSchema,
} from "./convention.schema";

type BeneficiaryConvention = {
  conventionId: ConventionId;
  businessName: BusinessName | BusinessNameCustomized;
  status: ConventionStatus;
  assessment: ConventionAssessmentFields["assessment"];
  dateStart: DateString;
  dateEnd: DateString;
};

const beneficiaryConventionSchema: ZodSchemaWithInputMatchingOutput<BeneficiaryConvention> =
  z.object({
    conventionId: conventionIdSchema,
    businessName: businessNameSchema,
    status: conventionStatusSchema,
    assessment: conventionAssessmentFieldsSchema,
    dateStart: conventionDateStartSchema,
    dateEnd: conventionDateEndSchema,
  });

export type BeneficiaryConventionListDto = BeneficiaryConvention[];
export const beneficiaryConventionListDtoSchema: ZodSchemaWithInputMatchingOutput<BeneficiaryConventionListDto> =
  z.array(beneficiaryConventionSchema);
