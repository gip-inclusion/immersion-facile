import {
  type AssessmentDto,
  assessmentDtoSchema,
  type ConventionReadDto,
  conventionReadSchema,
  type FormAssessmentDto,
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

export const broadcastConventionParamsSchema: z.ZodType<
  BroadcastConventionParams,
  | {
      eventType: "CONVENTION_UPDATED";
      convention: ConventionReadDto;
    }
  | {
      eventType: "ASSESSMENT_CREATED";
      convention: ConventionReadDto;
      assessment: FormAssessmentDto;
    }
> = z.union([
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
