import { z } from "zod";
import { absoluteUrlSchema } from "../AbsoluteUrl";
import { agencyIdSchema, agencyKindSchema } from "../agency/agency.schema";
import { phoneSchema } from "../convention/convention.schema";
import { emailSchema } from "../email/email.schema";
import { ApiConsumerJwt } from "../tokens/jwt.dto";
import { localization, zStringMinLength1 } from "../zodUtils";
import {
  ApiConsumer,
  ApiConsumerContact,
  apiConsumerKinds,
  ApiConsumerRights,
  SubscriptionParams,
  WebhookSubscription,
} from "./ApiConsumer";

const apiConsumerContactSchema: z.Schema<ApiConsumerContact> = z.object({
  lastName: zStringMinLength1,
  firstName: zStringMinLength1,
  job: zStringMinLength1,
  phone: phoneSchema,
  emails: z.array(emailSchema),
});

const subscriptionSchema: z.Schema<SubscriptionParams> = z.object({
  callbackUrl: absoluteUrlSchema,
  callbackHeaders: z.object({ authorization: z.string() }),
});

export const apiConsumerJwtSchema: z.Schema<ApiConsumerJwt> = z.string();

const apiConsumerRightsSchema: z.Schema<ApiConsumerRights> = z.object({
  searchEstablishment: z.object({
    kinds: z.array(z.enum(apiConsumerKinds)),
    scope: z.literal("no-scope"),
    subscriptions: z
      .object({
        "convention.updated": subscriptionSchema,
      })
      .optional(),
  }),
  convention: z.object({
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
    subscriptions: z
      .object({
        "convention.updated": subscriptionSchema,
      })
      .optional(),
  }),
});

export const apiConsumerSchema: z.Schema<ApiConsumer> = z.object({
  id: z.string().uuid(localization.invalidUuid),
  consumer: zStringMinLength1,
  contact: apiConsumerContactSchema,
  rights: apiConsumerRightsSchema,
  createdAt: zStringMinLength1,
  expirationDate: zStringMinLength1,
  description: z.string().optional(),
});

export const webhookSubscriptionSchema: z.Schema<WebhookSubscription> =
  z.object({
    subscribedEvent: z.enum(["convention.updated"]),
    callbackUrl: absoluteUrlSchema,
    callbackHeaders: z.object({ authorization: z.string() }),
  });
