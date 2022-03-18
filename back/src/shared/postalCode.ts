import { z } from "zod";

export interface CapturePostalCodeResult {
  postalCode: string;
  hasPostalCode: boolean;
}

export const capturePostalCode = (
  addressString: string,
): CapturePostalCodeResult => {
  const capturePostalCodeRegex = /(?<postalCode>[0-9]{5})/u;
  const capture = capturePostalCodeRegex.exec(addressString);

  return {
    postalCode: capture?.groups?.["postalCode"] ?? "",
    hasPostalCode: capture !== null,
  };
};

// Matches strings that contain at least one 5-digit number.
const postalCodeRegex = /(^|\s|,)\d{5}(\s|$|,)/;
export const addressWithPostalCodeSchema = z
  .string()
  .regex(postalCodeRegex, "Veuillez spécifier un code postal dans l'adresse.");
