import {
  type AgencyId,
  type AssessmentDto,
  agencyIdSchema,
  type ConventionId,
  type ConventionReadDto,
  conventionIdSchema,
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
