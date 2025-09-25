import { z } from "zod";
import { absoluteUrlSchema } from "../AbsoluteUrl";
import {
  apiConsumerIdSchema,
  apiConsumerNameSchema,
} from "../apiConsumer/apiConsumer.schema";
import { conventionStatuses } from "../convention/convention.dto";
import { conventionIdSchema } from "../convention/convention.schema";

export const broadcastFeedbackResponseSchema = z
  .object({
    httpStatus: z.number(),
    body: z.unknown().optional(),
  })
  .nullable();

export const subscriberErrorFeedbackSchema = z.object({
  message: z.string(),
  error: z.unknown().optional(),
});

export const conventionBroadcastRequestParamsSchema = z.object({
  conventionId: conventionIdSchema,
  callbackUrl: absoluteUrlSchema.optional(),
  conventionStatus: z.enum(conventionStatuses).optional(),
});

export const broadcastFeedbackSchema = z
  .object({
    serviceName: z.string(),
    consumerId: apiConsumerIdSchema.nullable(),
    consumerName: apiConsumerNameSchema,
    subscriberErrorFeedback: subscriberErrorFeedbackSchema.optional(),
    requestParams: conventionBroadcastRequestParamsSchema,
    response: broadcastFeedbackResponseSchema.optional(),
    occurredAt: z.date(),
    handledByAgency: z.boolean(),
  })
  .nullable();
