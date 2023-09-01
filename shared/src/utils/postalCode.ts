import { localization, zStringMinLength1 } from "../zodUtils";

// Matches strings that contain at least one 5-digit number.
const postalCodeRegex = /(^|\s|,)\d{5}(\s|$|,)/;
export const addressWithPostalCodeSchema = zStringMinLength1
  .max(255, localization.maxCharacters(255))
  .regex(postalCodeRegex, localization.invalidPostalCode);
