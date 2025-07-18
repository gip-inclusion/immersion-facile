import {
  type AssessmentDto,
  assessmentDtoSchema,
  type ConventionReadDto,
  conventionReadSchema,
} from "shared";
import { z } from "zod";

export type BroadcastConventionParams =
  | {
      eventType: "CONVENTION_UPDATED";
      convention: ConventionReadDto;
    }
  | {
      eventType: "ASSESSMENT_CREATED";
      convention: ConventionReadDto;
      assessment: AssessmentDto;
    };

export const broadcastConventionParamsSchema: z.Schema<BroadcastConventionParams> =
  z.union([
    z.object({
      eventType: z.literal("CONVENTION_UPDATED"),
      convention: conventionReadSchema,
    }),
    z.object({
      eventType: z.literal("ASSESSMENT_CREATED"),
      convention: conventionReadSchema,
      assessment: assessmentDtoSchema,
    }),
  ]);
