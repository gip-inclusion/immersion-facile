import { z } from "zod";
import { callbackUrlSchema } from "../AbsoluteUrl";
import { agencyIdSchema, agencyKindSchema } from "../agency/agency.schema";
import { phoneSchema } from "../convention/convention.schema";
import { emailSchema } from "../email/email.schema";
import { dateTimeIsoStringSchema } from "../schedule/Schedule.schema";
import { ApiConsumerJwt } from "../tokens/jwt.dto";
import { dateRegExp } from "../utils/date";
import { localization, zStringMinLength1 } from "../zodUtils";
import {
  ApiConsumer,
  ApiConsumerContact,
  apiConsumerKinds,
  authorizedCallbackHeaderKeys,
  CallbackHeaders,
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

export const apiConsumerJwtSchema: z.Schema<ApiConsumerJwt> = z.string();

const callbackHeadersSchema: z.Schema<CallbackHeaders> = z.record(
  z.enum(authorizedCallbackHeaderKeys),
  zStringMinLength1,
);

export const createWebhookSubscriptionSchema: z.Schema<CreateWebhookSubscription> =
  z.object({
    subscribedEvent: z.enum(["convention.updated"]),
    callbackUrl: callbackUrlSchema,
    callbackHeaders: callbackHeadersSchema,
  });

export const webhookSubscriptionSchema: z.Schema<WebhookSubscription> =
  createWebhookSubscriptionSchema.and(
    z.object({
      id: z.string(),
      createdAt: dateTimeIsoStringSchema,
    }),
  );

const searchEstablishmentRightCommonSchema = z.object({
  kinds: z.array(z.enum(apiConsumerKinds)),
  scope: z.literal("no-scope"),
});

const createSearchEstablishmentRightSchema =
  searchEstablishmentRightCommonSchema.and(
    z.object({
      subscriptions: z.array(createWebhookSubscriptionSchema),
    }),
  );

const searchEstablishmentRightSchema = searchEstablishmentRightCommonSchema.and(
  z.object({ subscriptions: z.array(webhookSubscriptionSchema) }),
);

const conventionRightCommonSchema = z.object({
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

const createConventionRightSchema = conventionRightCommonSchema.and(
  z.object({
    subscriptions: z.array(createWebhookSubscriptionSchema),
  }),
);

const conventionRightSchema = conventionRightCommonSchema.and(
  z.object({
    subscriptions: z.array(webhookSubscriptionSchema),
  }),
);

const createApiConsumerRightsSchema: z.Schema<CreateApiConsumerRights> =
  z.object({
    searchEstablishment: createSearchEstablishmentRightSchema,
    convention: createConventionRightSchema,
  });

const apiConsumerRightsSchema: z.Schema<ApiConsumer["rights"]> = z.object({
  searchEstablishment: searchEstablishmentRightSchema,
  convention: conventionRightSchema,
});

export const createApiConsumerSchema: z.Schema<CreateApiConsumerParams> =
  z.object({
    id: z.string().uuid(localization.invalidUuid),
    consumer: zStringMinLength1,
    contact: apiConsumerContactSchema,
    rights: createApiConsumerRightsSchema,
    description: z.string().optional(),
  });

export const apiConsumerSchema: z.Schema<ApiConsumer> = z.object({
  id: z.string().uuid(localization.invalidUuid),
  consumer: zStringMinLength1,
  contact: apiConsumerContactSchema,
  rights: apiConsumerRightsSchema,
  createdAt: zStringMinLength1.regex(dateRegExp),
  expirationDate: zStringMinLength1.regex(dateRegExp),
  description: z.string().optional(),
});
