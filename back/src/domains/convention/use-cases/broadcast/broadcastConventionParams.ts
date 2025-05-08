import {
  type AssessmentDto,
  type ConventionDto,
  assessmentDtoSchema,
  conventionSchema,
} from "shared";
import { z } from "zod";

export type BroadcastConventionParams =
  | {
      eventType: "CONVENTION_UPDATED";
      convention: ConventionDto;
    }
  | {
      eventType: "ASSESSMENT_CREATED";
      convention: ConventionDto;
      assessment: AssessmentDto;
    };

export const broadcastConventionParamsSchema: z.Schema<BroadcastConventionParams> =
  z.union([
    z.object({
      eventType: z.literal("CONVENTION_UPDATED"),
      convention: conventionSchema,
    }),
    z.object({
      eventType: z.literal("ASSESSMENT_CREATED"),
      convention: conventionSchema,
      assessment: assessmentDtoSchema,
    }),
  ]);
