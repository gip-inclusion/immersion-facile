import { z } from "zod";
import { phoneSchema } from "../convention/convention.schema";
import { emailSchema } from "../email/email.schema";
import { localization, zStringMinLength1 } from "../zodUtils";
import { ApiConsumer, ApiConsumerContact } from "./ApiConsumer";

const apiConsumerContactSchema: z.Schema<ApiConsumerContact> = z.object({
  lastName: zStringMinLength1,
  firstName: zStringMinLength1,
  job: zStringMinLength1,
  phone: phoneSchema,
  emails: z.array(emailSchema),
});

export const apiConsumerSchema: z.Schema<ApiConsumer> = z.object({
  id: z.string().uuid(localization.invalidUuid),
  consumer: zStringMinLength1,
  contact: apiConsumerContactSchema,
  isAuthorized: z.boolean(),
  createdAt: z.coerce.date(),
  expirationDate: z.coerce.date(),
  description: z.string().optional(),
});
