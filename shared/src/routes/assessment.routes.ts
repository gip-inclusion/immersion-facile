import { defineRoute, defineRoutes } from "shared-routes";
import z from "zod";
import {
  assessmentDtoSchema,
  legacyAssessmentDtoSchema,
} from "../assessment/assessment.schema";
import { withAuthorizationHeaders } from "../headers";
import { httpErrorSchema } from "../httpClient/httpErrors.schema";

export type AssessmentRoutes = typeof assessmentRoutes;

export const assessmentRoutes = defineRoutes({
  getAssessmentsForAgencyUser: defineRoute({
    method: "get",
    url: "/assessments-for-agency-user",
    ...withAuthorizationHeaders,
    responses: {
      200: z.array(assessmentDtoSchema.or(legacyAssessmentDtoSchema)),
      401: httpErrorSchema,
    },
  }),
});
