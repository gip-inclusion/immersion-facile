import { z } from "zod";
import {
  ImmersionAssessmentDto,
  assessmentStatuses,
} from "./ImmersionAssessmentDto";

export const immersionAssessmentSchema: z.Schema<ImmersionAssessmentDto> =
  z.object({
    id: z.string(),
    status: z.enum(assessmentStatuses),
    establishmentFeedback: z.string(),
    conventionId: z.string(),
  });
