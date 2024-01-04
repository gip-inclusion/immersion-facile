import { z } from "zod";
import { localization, zEnumValidation, zStringMinLength1 } from "../zodUtils";
import {
  AssessmentDto,
  assessmentStatuses,
  WithAssessmentDto,
} from "./assessment.dto";

export const assessmentSchema: z.Schema<AssessmentDto> = z.object({
  conventionId: z.string(),
  status: zEnumValidation(
    assessmentStatuses,
    localization.expectRadioButtonSelected,
  ),
  establishmentFeedback: zStringMinLength1,
});

export const withAssessmentSchema: z.Schema<WithAssessmentDto> = z.object({
  assessment: assessmentSchema,
});
