import {
  CountryCode,
  isValidPhoneNumber,
  parsePhoneNumber,
} from "libphonenumber-js";
import { z } from "zod";
import { zStringMinLength1 } from "./zodUtils";

const supportedCountryCode: CountryCode[] = ["FR", "NC", "PF", "WF", "PM"];

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
