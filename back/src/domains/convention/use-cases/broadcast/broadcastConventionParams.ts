import {
  type AgencyId,
  type AssessmentDto,
  agencyIdSchema,
  assessmentDtoSchema,
  type ConventionId,
  type ConventionReadDto,
  conventionIdSchema,
  conventionReadSchema,
  type FormAssessmentDto,
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
    previousAgencyId: agencyIdSchema.optional(),
  }),
  z.object({
    eventType: z.literal("ASSESSMENT_CREATED"),
    convention: conventionReadSchema,
    assessment: assessmentDtoSchema,
  }),
]);
