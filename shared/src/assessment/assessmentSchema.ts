import { z } from "zod";
import { localization, zEnumValidation, zStringMinLength1 } from "../zodUtils";
import { AssessmentDto, assessmentStatuses } from "./AssessmentDto";

export const assessmentSchema: z.Schema<AssessmentDto> = z.object({
  conventionId: z.string(),
  status: zEnumValidation(
    assessmentStatuses,
    localization.expectRadioButtonSelected,
  ),
  establishmentFeedback: zStringMinLength1,
});
