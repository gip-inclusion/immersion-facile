import parsePhoneNumberFromString, {
  type CountryCode,
  isValidPhoneNumber,
} from "libphonenumber-js";
import { parsePhoneNumber } from "libphonenumber-js/mobile";
import { keys } from "ramda";
import { z } from "zod";
import {
  countryCodesData,
  defaultCountryCode,
  isSupportedCountryCode,
  type SupportedCountryCode,
  territoriesByCountryCode,
} from "../address/address.dto";
import { zStringMinLength1 } from "../zodUtils";
import type { PhoneNumber } from "./phone.dto";

export const phoneNumberSchema: z.Schema<PhoneNumber> =
  zStringMinLength1.transform((phone, ctx) => {
    const countryCodeFromPhoneNumber =
      getCountryCodeFromPhoneNumber(phone) ?? defaultCountryCode;
    const isValid = isValidPhoneNumber(phone, countryCodeFromPhoneNumber);
    if (!isValid) {
      ctx.addIssue({
        message: `Le numéro de téléphone '${phone}' n'est pas valide en ${countryCodesData[countryCodeFromPhoneNumber].name}.`,
        code: "custom",
      });
      return z.NEVER;
    }
    return parsePhoneNumber(phone, countryCodeFromPhoneNumber).format("E.164");
  });

export const isValidMobilePhone = (phoneNumber: PhoneNumber): boolean =>
  parsePhoneNumber(phoneNumber).getType() === "MOBILE";

export const toDisplayedPhoneNumber = (
  phoneNumber: string,
): string | undefined => parsePhoneNumber(phoneNumber).format("NATIONAL");

export const formatWithPhoneNumberPrefix = (
  phoneNumber: string,
  countryCode: SupportedCountryCode,
): string | undefined => {
  const nationalNumber =
    parsePhoneNumberFromString(phoneNumber)?.nationalNumber;
  return nationalNumber
    ? parsePhoneNumber(nationalNumber, countryCode).format("E.164")
    : parsePhoneNumber(phoneNumber, countryCode).format("E.164");
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
