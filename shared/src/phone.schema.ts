import { type CountryCode, isValidPhoneNumber } from "libphonenumber-js";
import { parsePhoneNumber } from "libphonenumber-js/mobile";
import { z } from "zod";
import type { Phone } from "./sms/smsTemplateByName";
import { zStringMinLength1 } from "./zodUtils";

const domComSupportedCountryCodes: CountryCode[] = [
  "GF",
  "YT",
  "GP",
  "MQ",
  "RE",
  "WF",
  "PM",
  "NC",
  "PF",
];

const supportedCountryCode: CountryCode[] = [
  ...domComSupportedCountryCodes,
  "FR",
];

export const phoneSchema: z.Schema<Phone> = zStringMinLength1.transform(
  (phone, ctx) => {
    const countryCode = supportedCountryCode.find((countryCode) =>
      isValidPhoneNumber(phone, countryCode),
    );

    if (!countryCode) {
      ctx.addIssue({
        message: `Le numéro de téléphone '${phone}' n'est pas valide.`,
        code: "custom",
      });
      return z.NEVER;
    }
    return parsePhoneNumber(phone, countryCode).format("E.164");
  },
);

export const isValidMobilePhone = (phoneNumber: Phone) => {
  return parsePhoneNumber(phoneNumber).getType() === "MOBILE";
};
