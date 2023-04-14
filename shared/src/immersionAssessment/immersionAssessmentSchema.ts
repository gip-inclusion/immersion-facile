import { z } from "zod";
import { zString, zEnumValidation } from "../zodUtils";
import {
  assessmentStatuses,
  ImmersionAssessmentDto,
} from "./ImmersionAssessmentDto";

export const immersionAssessmentSchema: z.Schema<ImmersionAssessmentDto> =
  z.object({
    conventionId: z.string(),
    status: zEnumValidation(assessmentStatuses, "obligatoire"),
    establishmentFeedback: zString,
  });
