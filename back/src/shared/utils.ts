import { z } from "zod";

// TODO: find the standard for gouv.fr phone verification
export const phoneRegExp = /^\+?[0-9]+$/;

export const sleep = (ms: number) => {
  if (ms <= 0) {
    return;
  }
  return new Promise((r) => setTimeout(r, ms));
};

// Matches strings that contain at least one 5-digit number.
const postalCodeRegex = /(^|\s|,)\d{5}(\s|$|,)/;
export const addressWithPostalCodeSchema = z
  .string()
  .regex(postalCodeRegex, "Veuillez spécifier un code postal dans l'adresse.");

export const removeAtIndex = <T>(array: T[], indexToRemove: number): T[] => [
  ...array.slice(0, indexToRemove),
  ...array.slice(indexToRemove + 1),
];

export type NotEmptyArray<T> = [T, ...T[]];

export const keys = <T extends string | number | symbol>(
  obj: Partial<Record<T, unknown>>,
): T[] => Object.keys(obj) as T[];
