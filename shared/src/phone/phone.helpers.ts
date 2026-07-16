import { parsePhoneNumberFromString } from "libphonenumber-js";
import type { PhoneNumber } from "./phone.dto";

export function getFormattedLocalPhoneNumber(phone: PhoneNumber): string {
  const phoneNumber = parsePhoneNumberFromString(phone);

  if (!phoneNumber || !phoneNumber.isValid()) {
    throw new Error("Numéro de téléphone invalide");
  }

  return phoneNumber.formatNational();
}
