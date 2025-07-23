import parsePhoneNumberFromString, {
  type CountryCode,
  isValidPhoneNumber,
} from "libphonenumber-js";
import { parsePhoneNumber } from "libphonenumber-js/mobile";
import { keys } from "ramda";
import { z } from "zod";
import {
  getSupportedCountryCodesForCountry,
  isSupportedCountryCode,
  type SupportedCountryCode,
  territoriesByCountryCode,
} from "../address/address.dto";
import { zStringMinLength1 } from "../zodUtils";
import type { PhoneNumber } from "./phone.dto";

export const phoneNumberSchema: z.Schema<PhoneNumber> =
  zStringMinLength1.transform((phone, ctx) => {
    const countryCode = getSupportedCountryCodesForCountry("FR").find(
      (countryCode) => isValidPhoneNumber(phone, countryCode),
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

export const isValidMobilePhone = (phoneNumber: PhoneNumber) => {
  return parsePhoneNumber(phoneNumber).getType() === "MOBILE";
};

export const toDisplayedPhoneNumber = (phoneNumber: string) => {
  return parsePhoneNumber(phoneNumber).format("NATIONAL");
};

export const toInternationalPhoneNumber = (
  phoneNumber: string,
  countryCode: SupportedCountryCode,
) => {
  const validCountryCode = getSupportedCountryCodesForCountry(countryCode).find(
    (countryCode) => isValidPhoneNumber(phoneNumber, countryCode),
  );
  console.log("validCountryCode", validCountryCode);
  if (!validCountryCode) {
    return;
  }
  return parsePhoneNumber(phoneNumber, validCountryCode).format("E.164");
};

export const getCountryCodeFromPhoneNumber = (
  phoneNumber: string,
): SupportedCountryCode | undefined => {
  const countryCodeOrTerritory =
    parsePhoneNumberFromString(phoneNumber)?.country;

  if (
    countryCodeOrTerritory &&
    isSupportedCountryCode(countryCodeOrTerritory)
  ) {
    return countryCodeOrTerritory;
  }

  const countryCodeFromTerritory = keys(territoriesByCountryCode).find(
    (territory) =>
      territoriesByCountryCode[territory].includes(
        countryCodeOrTerritory as CountryCode,
      ),
  );
  if (countryCodeFromTerritory) {
    return countryCodeFromTerritory;
  }

  return undefined;
};
