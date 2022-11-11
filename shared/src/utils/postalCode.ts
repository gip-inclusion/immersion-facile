import { maxMessage, zString } from "../zodUtils";

// Matches strings that contain at least one 5-digit number.
const postalCodeRegex = /(^|\s|,)\d{5}(\s|$|,)/;
export const addressWithPostalCodeSchema = zString
  .max(255, maxMessage(255))
  .regex(postalCodeRegex, "Veuillez spécifier un code postal dans l'adresse.");
