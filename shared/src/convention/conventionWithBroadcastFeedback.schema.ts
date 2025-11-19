import z from "zod";
import { broadcastFeedbackSchema } from "../broadcast/broadcastFeedback.schema";
import { createPaginatedSchema } from "../pagination/pagination.schema";
import type { ZodSchemaWithInputMatchingOutput } from "../zodUtils";
import {
  conventionIdSchema,
  withFirstnameAndLastnameSchema,
} from "./convention.schema";
import type { ConventionWithBroadcastFeedback } from "./conventionWithBroadcastFeedback.dto";

export const conventionWithBroadcastFeedbackSchema: ZodSchemaWithInputMatchingOutput<ConventionWithBroadcastFeedback> =
  z.object({
    id: conventionIdSchema,
    beneficiary: withFirstnameAndLastnameSchema,
    lastBroadcastFeedback: broadcastFeedbackSchema,
  });

export const paginatedConventionWithBroadcastFeedbackSchema =
  createPaginatedSchema(conventionWithBroadcastFeedbackSchema);
