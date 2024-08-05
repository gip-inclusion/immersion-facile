import { z } from "zod";
import { callbackUrlSchema } from "../AbsoluteUrl";
import { agencyIdSchema, agencyKindSchema } from "../agency/agency.schema";
import { emailSchema } from "../email/email.schema";
import { phoneSchema } from "../phone.schema";
import {
  dateTimeIsoStringSchema,
  makeDateStringSchema,
} from "../schedule/Schedule.schema";
import { ApiConsumerJwt } from "../tokens/jwt.dto";
import {
  localization,
  stringWithMaxLength255,
  zStringMinLength1,
} from "../zodUtils";
import {
  ApiConsumer,
  ApiConsumerContact,
  ApiConsumerName,
  ApiConsumerSubscriptionId,
  CallbackHeaders,
  CreateWebhookSubscription,
  WebhookSubscription,
  WriteApiConsumerParams,
  WriteApiConsumerRights,
  apiConsumerKinds,
  authorizedCallbackHeaderKeys,
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

const noScopeRightSchema = z.object({
  kinds: z.array(z.enum(apiConsumerKinds)),
  scope: z.literal("no-scope"),
});

const withNoSubscriptionSchema = z.object({
  subscriptions: z.array(z.never()),
});

const createSearchEstablishmentRightSchema = noScopeRightSchema.and(
  z.object({
    subscriptions: z.array(createWebhookSubscriptionSchema),
  }),
);

const statisticsRightSchema = noScopeRightSchema.and(withNoSubscriptionSchema);

const searchEstablishmentRightSchema = noScopeRightSchema.and(
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

const writeApiConsumerRightsSchema: z.Schema<WriteApiConsumerRights> = z.object(
  {
    searchEstablishment: createSearchEstablishmentRightSchema,
    convention: createConventionRightSchema,
    statistics: statisticsRightSchema,
  },
);

const apiConsumerRightsSchema: z.Schema<ApiConsumer["rights"]> = z.object({
  searchEstablishment: searchEstablishmentRightSchema,
  convention: conventionRightSchema,
  statistics: statisticsRightSchema,
});

const commonApiConsumerShape = {
  id: z.string().uuid(localization.invalidUuid),
  name: stringWithMaxLength255,
  contact: apiConsumerContactSchema,
  rights: writeApiConsumerRightsSchema,
  description: z.string().optional(),
  expirationDate: makeDateStringSchema(),
};

export const writeApiConsumerSchema: z.Schema<WriteApiConsumerParams> =
  z.object(commonApiConsumerShape);

export const apiConsumerSchema: z.Schema<ApiConsumer> = z.object({
  ...commonApiConsumerShape,
  createdAt: makeDateStringSchema(),
  rights: apiConsumerRightsSchema,
});

export const apiConsumerSubscriptionIdSchema: z.Schema<ApiConsumerSubscriptionId> =
  z.string();

export const apiConsumerReadSchema: z.Schema<ApiConsumerName[]> = z.array(
  zStringMinLength1.max(255),
);
