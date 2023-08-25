import { z } from "zod";
import { phoneSchema } from "../convention/convention.schema";
import { emailSchema } from "../email/email.schema";
import { localization, zString } from "../zodUtils";
import { ApiConsumer, ApiConsumerContact } from "./ApiConsumer";

const apiConsumerContactSchema: z.Schema<ApiConsumerContact> = z.object({
  lastName: zString,
  firstName: zString,
  job: zString,
  phone: phoneSchema,
  emails: z.array(emailSchema),
});

export const apiConsumerSchema: z.Schema<ApiConsumer> = z.object({
  id: z.string().uuid(localization.invalidUuid),
  consumer: zString,
  contact: apiConsumerContactSchema,
  isAuthorized: z.boolean(),
  createdAt: z.coerce.date(),
  expirationDate: z.coerce.date(),
  description: zString.optional(),
});
