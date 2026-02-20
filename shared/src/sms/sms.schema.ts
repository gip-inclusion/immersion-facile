import parseMobile from "libphonenumber-js/mobile";
import { z } from "zod";
import type { PhoneNumber } from "../phone/phone.dto";
import { phoneNumberSchema } from "../phone/phone.schema";
import { makeHardenedStringSchema } from "../utils/string.schema";
import type { ZodSchemaWithInputMatchingOutput } from "../zodUtils";
import type { SmsTemplateKind, TemplatedSms } from "./smsTemplateByName";

const MAX_INTERNATIONAL_PHONE_DIGIT_SIZE = 15;

//Mobile number to send SMS with the country code - Limited on this gateway to allow only french mobile phones
export const smsRecipientPhoneSchema: ZodSchemaWithInputMatchingOutput<PhoneNumber> =
  // TODO : pour review > schema original z.string() > on veut autoriser les données vide avant le superRefine?
  makeHardenedStringSchema({
    max: MAX_INTERNATIONAL_PHONE_DIGIT_SIZE + 5,
  }).superRefine((phone, ctx) => {
    if (
      phoneNumberSchema.safeParse(phone).success &&
      parseMobile(phone)?.getType() !== "MOBILE"
    )
      ctx.addIssue({
        message: `The phone number '${phone}' is not supported.`,
        code: "custom",
      });
  });

const smsTemplateKindSchema: ZodSchemaWithInputMatchingOutput<SmsTemplateKind> =
  z.literal(["ReminderForSignatories", "ReminderForAssessment", "HelloWorld"]);

export const templatedSmsSchema = z.object({
  kind: smsTemplateKindSchema,
  recipientPhone: smsRecipientPhoneSchema,
  params: z.any(),
}) as ZodSchemaWithInputMatchingOutput<TemplatedSms>;
