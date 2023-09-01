import { z } from "zod";
import { localization, zEnumValidation, zStringMinLength1 } from "../zodUtils";
import {
  assessmentStatuses,
  ImmersionAssessmentDto,
} from "./ImmersionAssessmentDto";

export const immersionAssessmentSchema: z.Schema<ImmersionAssessmentDto> =
  z.object({
    conventionId: z.string(),
    status: zEnumValidation(
      assessmentStatuses,
      localization.expectRadioButtonSelected,
    ),
    establishmentFeedback: zStringMinLength1,
  });
