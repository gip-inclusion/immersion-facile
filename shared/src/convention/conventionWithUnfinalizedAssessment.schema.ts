import { z } from "zod";
import { createPaginatedSchema } from "../pagination/pagination.schema";
import { makeDateStringSchema } from "../utils/date";
import type { ZodSchemaWithInputMatchingOutput } from "../zodUtils";
import {
  conventionAssessmentFieldsSchema,
  conventionIdSchema,
  withFirstnameAndLastnameSchema,
} from "./convention.schema";
import type { ConventionWithUnfinalizedAssessment } from "./conventionWithUnfinalizedAssessment.dto";

export const conventionWithUnfinalizedAssessmentSchema: ZodSchemaWithInputMatchingOutput<ConventionWithUnfinalizedAssessment> =
  z.object({
    id: conventionIdSchema,
    dateEnd: makeDateStringSchema(),
    beneficiary: withFirstnameAndLastnameSchema,
    assessment: conventionAssessmentFieldsSchema,
  });

export const paginatedConventionWithUnfinalizedAssessmentSchema =
  createPaginatedSchema(conventionWithUnfinalizedAssessmentSchema);
