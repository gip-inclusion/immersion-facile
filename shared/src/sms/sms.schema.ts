import { z } from "zod";
import type { Phone, TemplatedSms } from "./smsTemplateByName";

//Mobile number to send SMS with the country code - Limited on this gateway to allow only french mobile phones
export const smsRecipientPhoneSchema: z.Schema<Phone> = z
  .string()
  .superRefine((phone, ctx) => {
    if (
      !(
        isSupportedPhone(phone, franceMetropolitanPrefixes, 11) ||
        isSupportedPhone(phone, franceDomPrefixes, 12)
      )
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

const isSupportedPhone = (
  phone: string,
  phoneStartsWithOptions: string[],
  phoneLength: number,
): boolean =>
  phoneStartsWithOptions.some((option) => phone.startsWith(option)) &&
  phone.length === phoneLength;

const franceDomPrefixes = [
  "590690",
  "590691",
  "594694",
  "596696",
  "596697",
  "262639",
  "262692",
  "262693",
];
const franceMetropolitanPrefixes = ["336", "337"];
