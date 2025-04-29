import {
  type AssessmentDto,
  type ConventionDto,
  assessmentDtoSchema,
  conventionSchema,
} from "shared";
import { z } from "zod";

export type BroadcastConventionParams = {
  eventType: "CONVENTION_UPDATED" | "ASSESSMENT_CREATED";
  convention: ConventionDto;
  assessment?: AssessmentDto;
};

export const broadcastConventionParamsSchema: z.Schema<BroadcastConventionParams> =
  z.object({
    eventType: z.enum(["CONVENTION_UPDATED", "ASSESSMENT_CREATED"]),
    convention: conventionSchema,
    assessment: assessmentDtoSchema.optional(),
  });
