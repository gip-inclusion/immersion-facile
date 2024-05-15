import parseMobile from "libphonenumber-js/mobile";
import { z } from "zod";
import { phoneSchema } from "../phone.schema";
import type { Phone, TemplatedSms } from "./smsTemplateByName";

//Mobile number to send SMS with the country code - Limited on this gateway to allow only french mobile phones
export const smsRecipientPhoneSchema: z.Schema<Phone> = z
  .string()
  .superRefine((phone, ctx) => {
    if (
      phoneSchema.safeParse(phone).success &&
      parseMobile(phone)?.getType() !== "MOBILE"
    )
      ctx.addIssue({
        message: `The phone number '${phone}' is not supported.`,
        code: "custom",
      });
  });

export const templatedSmsSchema = z.object({
  kind: z.string(),
  recipientPhone: smsRecipientPhoneSchema,
  params: z.any(),
}) as z.Schema<TemplatedSms>;
