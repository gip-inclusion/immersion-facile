import {
  CountryCode,
  isValidPhoneNumber,
  parsePhoneNumber,
} from "libphonenumber-js";
import { z } from "zod";
import { localization, zStringMinLength1 } from "./zodUtils";

const supportedCountryCode: CountryCode[] = ["FR", "NC", "PF", "WF", "PM"];

export const phoneRegExp = /^\+?[0-9]+$/;
export const emergencyContactPhoneSchema = zStringMinLength1.regex(
  phoneRegExp,
  localization.invalidPhone,
);

export const phoneSchema = zStringMinLength1.transform((phone, ctx) => {
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
});
