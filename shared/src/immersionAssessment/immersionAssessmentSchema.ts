import { z, ZodEnum } from "zod";
import { zString } from "../zodUtils";
import {
  assessmentStatuses,
  ImmersionAssessmentDto,
} from "./ImmersionAssessmentDto";

export const immersionAssessmentSchema: z.Schema<ImmersionAssessmentDto> =
  z.object({
    conventionId: z.string(),
    status: z.enum(assessmentStatuses),
    establishmentFeedback: zString,
  });
