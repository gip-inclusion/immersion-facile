import { z } from "zod";
import { absoluteUrlSchema } from "../AbsoluteUrl";
import { agencyIdSchema, agencyKindSchema } from "../agency/agency.schema";
import { phoneSchema } from "../convention/convention.schema";
import { emailSchema } from "../email/email.schema";
import { dateIsoStringSchema } from "../schedule/Schedule.schema";
import { ApiConsumerJwt } from "../tokens/jwt.dto";
import { localization, zStringMinLength1 } from "../zodUtils";
import {
  ApiConsumer,
  ApiConsumerContact,
  apiConsumerKinds,
  CreateApiConsumerParams,
  CreateApiConsumerRights,
  CreateWebhookSubscription,
  WebhookSubscription,
} from "./ApiConsumer";

const apiConsumerContactSchema: z.Schema<ApiConsumerContact> = z.object({
  lastName: zStringMinLength1,
  firstName: zStringMinLength1,
  job: zStringMinLength1,
  phone: phoneSchema,
  emails: z.array(emailSchema),
});

// const subscriptionSchema: z.Schema<SubscriptionParams> = z.object({
//   callbackUrl: absoluteUrlSchema,
//   callbackHeaders: z.object({ authorization: z.string() }),
// });

export const apiConsumerJwtSchema: z.Schema<ApiConsumerJwt> = z.string();

export const createWebhookSubscriptionSchema: z.Schema<CreateWebhookSubscription> =
  z.object({
    subscribedEvent: z.enum(["convention.updated"]),
    callbackUrl: absoluteUrlSchema,
    callbackHeaders: z.object({ authorization: z.string() }),
  });

export const webhookSubscriptionSchema: z.Schema<WebhookSubscription> =
  createWebhookSubscriptionSchema.and(
    z.object({
      id: z.string(),
      createdAt: dateIsoStringSchema,
    }),
  );

const searchEstablishmentRightSchema = z.object({
  kinds: z.array(z.enum(apiConsumerKinds)),
  scope: z.literal("no-scope"),
});

const conventionRightSchema = z.object({
  kinds: z.array(z.enum(apiConsumerKinds)),
  scope: z
    .object({
      agencyKinds: z.array(agencyKindSchema),
      agencyIds: z.undefined(),
    })
    .or(
      z.object({
        agencyKinds: z.undefined(),
        agencyIds: z.array(agencyIdSchema),
      }),
    ),
});

const createApiConsumerRightsSchema: z.Schema<CreateApiConsumerRights> =
  z.object({
    searchEstablishment: searchEstablishmentRightSchema as unknown as z.Schema<
      CreateApiConsumerRights["searchEstablishment"]
    >,
    convention: conventionRightSchema as unknown as z.Schema<
      CreateApiConsumerRights["convention"]
    >,
  });

export const createApiConsumerSchema: z.Schema<CreateApiConsumerParams> =
  z.object({
    id: z.string().uuid(localization.invalidUuid),
    consumer: zStringMinLength1,
    contact: apiConsumerContactSchema,
    rights: createApiConsumerRightsSchema,
    description: z.string().optional(),
  });

const apiConsumerRightsSchema: z.Schema<ApiConsumer["rights"]> = z.object({
  searchEstablishment: searchEstablishmentRightSchema.and(
    z.object({
      subscriptions: z.array(webhookSubscriptionSchema),
    }),
  ),
  convention: conventionRightSchema.and(
    z.object({
      subscriptions: z.array(webhookSubscriptionSchema),
    }),
  ),
});

export const apiConsumerSchema: z.Schema<ApiConsumer> = z.object({
  id: z.string().uuid(localization.invalidUuid),
  consumer: zStringMinLength1,
  contact: apiConsumerContactSchema,
  rights: apiConsumerRightsSchema,
  createdAt: dateIsoStringSchema,
  expirationDate: dateIsoStringSchema,
  description: z.string().optional(),
});
