// TODO: find the standard for gouv.fr phone verification
import { partition } from "ramda";

export const phoneRegExp = /^\+?[0-9]+$/;
export const stringOfNumbers = /^\+?[0-9]+$/;

export type SleepFn = typeof sleep;

// sleep function is use to simulate latency for demo and dev purpose
export const sleep = (ms: number): Promise<number> =>
  new Promise((resolve: any) => setTimeout(resolve, ms));

export type RandomFn = typeof random;
export const random = (max: number): number => Math.floor(Math.random() * max);

export const removeAtIndex = <T>(array: T[], indexToRemove: number): T[] => [
  ...array.slice(0, indexToRemove),
  ...array.slice(indexToRemove + 1),
];

export type TypeFromTuple<T extends unknown[]> = T[number];

export type NotEmptyArray<T> = [T, ...T[]];

export type ExcludeFromExisting<T extends string, K extends T> = Exclude<T, K>

export type OmitFromExistingKeys<
  T extends Record<string, unknown>,
  K extends keyof T,
> = Omit<T, K>;

export type RequireField<T, K extends keyof T> = T & Required<Pick<T, K>>;

export const keys = <T extends string | number | symbol>(
  obj: Partial<Record<T, unknown>>,
): T[] => Object.keys(obj) as T[];

export const removeUndefinedElements = <T>(
  unfilteredList: (T | undefined)[],
): T[] => unfilteredList.filter((el) => !!el) as T[];

export const replaceArrayElement = <T>(
  original: Array<T>,
  replaceAt: number,
  replaceBy: T,
) => [
  ...original.slice(0, replaceAt),
  replaceBy,
  ...original.slice(replaceAt + 1),
];
