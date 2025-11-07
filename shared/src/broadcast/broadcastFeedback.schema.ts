import { z } from "zod";
import { absoluteUrlSchema } from "../AbsoluteUrl";
import {
  apiConsumerIdSchema,
  apiConsumerNameSchema,
} from "../apiConsumer/apiConsumer.schema";
import { conventionStatuses } from "../convention/convention.dto";
import { conventionIdSchema } from "../convention/convention.schema";
import { makeDateStringSchema } from "../schedule/Schedule.schema";
import type {
  BroadcastFeedbackResponse,
  ConventionBroadcastRequestParams,
  ConventionLastBroadcastFeedbackResponse,
  SubscriberErrorFeedback,
} from "./broadcastFeedback.dto";

const broadcastFeedbackResponseSchema: z.Schema<BroadcastFeedbackResponse> = z
  .object({
    httpStatus: z.number(),
    body: z.unknown().optional(),
  })
  .nullable();

const subscriberErrorFeedbackSchema: z.Schema<SubscriberErrorFeedback> =
  z.object({
    message: z.string(),
    error: z.unknown().optional(),
  });

const conventionBroadcastRequestParamsSchema: z.Schema<ConventionBroadcastRequestParams> =
  z.object({
    conventionId: conventionIdSchema,
    callbackUrl: absoluteUrlSchema.optional(),
    conventionStatus: z.enum(conventionStatuses).optional(),
  });

export const broadcastFeedbackSchema: z.Schema<ConventionLastBroadcastFeedbackResponse> =
  z
    .object({
      serviceName: z.string(),
      consumerId: apiConsumerIdSchema.nullable(),
      consumerName: apiConsumerNameSchema,
      subscriberErrorFeedback: subscriberErrorFeedbackSchema.optional(),
      requestParams: conventionBroadcastRequestParamsSchema,
      response: broadcastFeedbackResponseSchema.optional(),
      occurredAt: makeDateStringSchema(),
      handledByAgency: z.boolean(),
    })
    .nullable();
