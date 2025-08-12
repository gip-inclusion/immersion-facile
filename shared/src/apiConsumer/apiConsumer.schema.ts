import { z } from "zod";
import { callbackUrlSchema } from "../AbsoluteUrl";
import { agencyIdSchema, agencyKindSchema } from "../agency/agency.schema";
import { emailSchema } from "../email/email.schema";
import { phoneNumberSchema } from "../phone/phone.schema";
import { makeDateStringSchema } from "../schedule/Schedule.schema";
import type { ApiConsumerJwt } from "../tokens/jwt.dto";
import { dateTimeIsoStringSchema } from "../utils/date";
import {
  localization,
  stringWithMaxLength255,
  type ZodSchemaWithInputMatchingOutput,
  zStringMinLength1,
} from "../zodUtils";
import {
  type ApiConsumer,
  type ApiConsumerContact,
  type ApiConsumerName,
  type ApiConsumerSubscriptionId,
  apiConsumerKinds,
  authorizedCallbackHeaderKeys,
  type CallbackHeaders,
  type CreateWebhookSubscription,
  type WebhookSubscription,
  type WriteApiConsumerParams,
  type WriteApiConsumerRights,
} from "./ApiConsumer";

const apiConsumerContactSchema: ZodSchemaWithInputMatchingOutput<ApiConsumerContact> =
  z.object({
    lastName: zStringMinLength1,
    firstName: zStringMinLength1,
    job: zStringMinLength1,
    phone: phoneNumberSchema,
    emails: z.array(emailSchema),
  });

export const apiConsumerJwtSchema: ZodSchemaWithInputMatchingOutput<ApiConsumerJwt> =
  z.string();

const callbackHeadersSchema: ZodSchemaWithInputMatchingOutput<CallbackHeaders> =
  z.record(
    z.enum(authorizedCallbackHeaderKeys, {
      error: localization.invalidEnum,
    }),
    zStringMinLength1,
  );

export const createWebhookSubscriptionSchema: ZodSchemaWithInputMatchingOutput<CreateWebhookSubscription> =
  z.object({
    subscribedEvent: z.enum(["convention.updated"], {
      error: localization.invalidEnum,
    }),
    callbackUrl: callbackUrlSchema,
    callbackHeaders: callbackHeadersSchema,
  });

export const webhookSubscriptionSchema: ZodSchemaWithInputMatchingOutput<WebhookSubscription> =
  createWebhookSubscriptionSchema.and(
    z.object({
      id: z.string(),
      createdAt: dateTimeIsoStringSchema,
    }),
  );

const noScopeRightSchema = z.object({
  kinds: z.array(
    z.enum(apiConsumerKinds, {
      error: localization.invalidEnum,
    }),
  ),
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
  kinds: z.array(
    z.enum(apiConsumerKinds, {
      error: localization.invalidEnum,
    }),
  ),
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

const writeApiConsumerRightsSchema: ZodSchemaWithInputMatchingOutput<WriteApiConsumerRights> =
  z.object({
    searchEstablishment: createSearchEstablishmentRightSchema,
    convention: createConventionRightSchema,
    statistics: statisticsRightSchema,
  });

const apiConsumerRightsSchema: ZodSchemaWithInputMatchingOutput<
  ApiConsumer["rights"]
> = z.object({
  searchEstablishment: searchEstablishmentRightSchema,
  convention: conventionRightSchema,
  statistics: statisticsRightSchema,
});

const commonApiConsumerShape = {
  id: z.string().uuid(localization.invalidUuid),
  name: stringWithMaxLength255,
  contact: apiConsumerContactSchema,
  rights: writeApiConsumerRightsSchema,
  description: z.string().max(255).optional(),
  expirationDate: makeDateStringSchema(),
};

export const writeApiConsumerSchema: ZodSchemaWithInputMatchingOutput<WriteApiConsumerParams> =
  z.object(commonApiConsumerShape);

export const apiConsumerSchema: ZodSchemaWithInputMatchingOutput<ApiConsumer> =
  z.object({
    ...commonApiConsumerShape,
    createdAt: makeDateStringSchema(),
    rights: apiConsumerRightsSchema,
  });

export const apiConsumerSubscriptionIdSchema: ZodSchemaWithInputMatchingOutput<ApiConsumerSubscriptionId> =
  z.string();

export const apiConsumerReadSchema: ZodSchemaWithInputMatchingOutput<
  ApiConsumerName[]
> = z.array(zStringMinLength1.max(255));
