import { z } from "zod";
import { localization, zEnumValidation, zString } from "../zodUtils";
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
    establishmentFeedback: zString,
  });
