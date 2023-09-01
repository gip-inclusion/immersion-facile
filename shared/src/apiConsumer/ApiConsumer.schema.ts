import { z } from "zod";
import { agencyIdSchema, agencyKindSchema } from "../agency/agency.schema";
import { phoneSchema } from "../convention/convention.schema";
import { emailSchema } from "../email/email.schema";
import { localization, zStringMinLength1 } from "../zodUtils";
import {
  ApiConsumer,
  ApiConsumerContact,
  apiConsumerKinds,
  ApiConsumerRights,
} from "./ApiConsumer";

const apiConsumerContactSchema: z.Schema<ApiConsumerContact> = z.object({
  lastName: zStringMinLength1,
  firstName: zStringMinLength1,
  job: zStringMinLength1,
  phone: phoneSchema,
  emails: z.array(emailSchema),
});

const apiConsumerRightsSchema: z.Schema<ApiConsumerRights> = z.object({
  searchEstablishment: z.object({
    kinds: z.array(z.enum(apiConsumerKinds)),
    scope: z.literal("no-scope"),
  }),
  convention: z.object({
    kinds: z.array(z.enum(apiConsumerKinds)),
    scope: z.object({
      agencyKinds: z.array(agencyKindSchema),
      agencyIds: z.array(agencyIdSchema),
    }),
  }),
});

export const apiConsumerSchema: z.Schema<ApiConsumer> = z.object({
  id: z.string().uuid(localization.invalidUuid),
  consumer: zStringMinLength1,
  contact: apiConsumerContactSchema,
  rights: apiConsumerRightsSchema,
  createdAt: z.coerce.date(),
  expirationDate: z.coerce.date(),
  description: z.string().optional(),
});
