import parseMobile from "libphonenumber-js/mobile";
import { z } from "zod";
import type { PhoneNumber } from "../phone/phone.dto";
import { phoneNumberSchema } from "../phone/phone.schema";
import type { ZodSchemaWithInputMatchingOutput } from "../zodUtils";
import type { TemplatedSms } from "./smsTemplateByName";

//Mobile number to send SMS with the country code - Limited on this gateway to allow only french mobile phones
export const smsRecipientPhoneSchema: ZodSchemaWithInputMatchingOutput<PhoneNumber> =
  z.string().superRefine((phone, ctx) => {
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
}) as ZodSchemaWithInputMatchingOutput<TemplatedSms>;
