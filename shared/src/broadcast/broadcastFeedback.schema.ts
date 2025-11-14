import { z } from "zod";
import { absoluteUrlSchema } from "../AbsoluteUrl";
import {
  apiConsumerIdSchema,
  apiConsumerNameSchema,
} from "../apiConsumer/apiConsumer.schema";
import { conventionStatuses } from "../convention/convention.dto";
import { conventionIdSchema } from "../convention/convention.schema";
import { makeDateStringSchema } from "../schedule/Schedule.schema";
import type { ZodSchemaWithInputMatchingOutput } from "../zodUtils";
import type {
  BroadcastFeedbackResponse,
  ConventionBroadcastRequestParams,
  ConventionLastBroadcastFeedbackResponse,
  SubscriberErrorFeedback,
} from "./broadcastFeedback.dto";

const broadcastFeedbackResponseSchema: ZodSchemaWithInputMatchingOutput<BroadcastFeedbackResponse> =
  z
    .object({
      httpStatus: z.number(),
      body: z.unknown().optional(),
    })
    .nullable();

const subscriberErrorFeedbackSchema: ZodSchemaWithInputMatchingOutput<SubscriberErrorFeedback> =
  z.object({
    message: z.string(),
    error: z.unknown().optional(),
  });

const conventionBroadcastRequestParamsSchema: ZodSchemaWithInputMatchingOutput<ConventionBroadcastRequestParams> =
  z.object({
    conventionId: conventionIdSchema,
    callbackUrl: absoluteUrlSchema.optional(),
    conventionStatus: z.enum(conventionStatuses).optional(),
  });

export const broadcastFeedbackSchema: ZodSchemaWithInputMatchingOutput<ConventionLastBroadcastFeedbackResponse> =
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
