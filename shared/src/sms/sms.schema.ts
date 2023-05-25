import { z } from "zod";
import type { Phone, TemplatedSms } from "./smsTemplateByName";

//Mobile number to send SMS with the country code - Limited on this gateway to allow only french mobile phones
export const smsRecipientPhoneSchema: z.Schema<Phone> = z
  .string()
  .refine(
    (recipient) =>
      (recipient.startsWith("336") || recipient.startsWith("337")) &&
      recipient.length === 11,
    "The phone number must be a french international mobile phone like '33611223344'",
  );

export const templatedSmsSchema = z.object({
  kind: z.string(),
  recipientPhone: smsRecipientPhoneSchema,
  params: z.any(),
}) as z.Schema<TemplatedSms>;
