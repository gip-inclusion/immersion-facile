import { z } from "zod";

// TODO: find the standard for gouv.fr phone verification
export const phoneRegExp = /^\+?[0-9]+$/;

export type SleepFn = typeof sleep;
export const sleep = (ms: number): Promise<number> => {
  if (ms <= 0) {
    return Promise.resolve(0);
  }
  return new Promise((r) => setTimeout(r, ms));
};

export type RandomFn = typeof random;
export const random = (max: number): number => {
  return Math.floor(Math.random() * max);
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

export const uniqBy = <T>(arr: T[], unicityCheck: (t: T) => string): T[] => {
  const itemsByUniqKey = arr.reduce((acc, item) => {
    if (item === null || item === undefined) return acc;
    const key = unicityCheck(item);

    if (acc.hasOwnProperty(key)) return acc;

    return { ...acc, [key]: item };
  }, {} as Record<string, T>);

  return Object.values(itemsByUniqKey);
};
