import {
  type AgencyId,
  type AssessmentDto,
  type AssessmentFormDto,
  agencyIdSchema,
  assessmentDtoSchema,
  type ConventionId,
  type ConventionReadDto,
  conventionIdSchema,
  conventionReadSchema,
} from "shared";
import { z } from "zod";

export type WithConventionIdAndPreviousAgencyId = {
  conventionId: ConventionId;
  previousAgencyId?: AgencyId;
};

export const withConventionIdAndPreviousAgencySchema = z.object({
  conventionId: conventionIdSchema,
  previousAgencyId: agencyIdSchema.optional(),
});

export type BroadcastConventionParams =
  | {
      eventType: "CONVENTION_UPDATED";
      convention: ConventionReadDto;
      previousAgencyId?: AgencyId;
      assessment?: AssessmentDto;
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
      previousAgencyId?: AgencyId;
      assessment?: AssessmentFormDto;
    }
  | {
      eventType: "ASSESSMENT_CREATED";
      convention: ConventionReadDto;
      assessment: AssessmentFormDto;
    }
> = z.union([
  z.object({
    eventType: z.literal("CONVENTION_UPDATED"),
    convention: conventionReadSchema,
    previousAgencyId: agencyIdSchema.optional(),
    assessment: assessmentDtoSchema.optional(),
  }),
  z.object({
    eventType: z.literal("ASSESSMENT_CREATED"),
    convention: conventionReadSchema,
    assessment: assessmentDtoSchema,
  }),
]);
