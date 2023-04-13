import { localization, zString } from "../zodUtils";

// Matches strings that contain at least one 5-digit number.
const postalCodeRegex = /(^|\s|,)\d{5}(\s|$|,)/;
export const addressWithPostalCodeSchema = zString
  .max(255, localization.maxCharacters(255))
  .regex(postalCodeRegex, localization.invalidPostalCode);
