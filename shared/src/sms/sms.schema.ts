import parseMobile from "libphonenumber-js/mobile";
import { z } from "zod/v4";
import type { PhoneNumber } from "../phone/phone.dto";
import { phoneNumberSchema } from "../phone/phone.schema";
import type { TemplatedSms } from "./smsTemplateByName";

//Mobile number to send SMS with the country code - Limited on this gateway to allow only french mobile phones
export const smsRecipientPhoneSchema: z.Schema<PhoneNumber> = z
  .string()
  .superRefine((phone, ctx) => {
    if (
      phoneNumberSchema.safeParse(phone).success &&
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
