// TODO: find the standard for gouv.fr phone verification
export const phoneRegExp = /^\+?[0-9]+$/;
export const stringOfNumbers = /^\+?[0-9]+$/;

export type SleepFn = typeof sleep;
export const sleep = (ms: number): Promise<number> => {
  if (ms <= 0) {
    return Promise.resolve(0);
  }
  return new Promise((r) => setTimeout(r, ms));
};

export type RandomFn = typeof random;
export const random = (max: number): number => Math.floor(Math.random() * max);

export const removeAtIndex = <T>(array: T[], indexToRemove: number): T[] => [
  ...array.slice(0, indexToRemove),
  ...array.slice(indexToRemove + 1),
];

export type NotEmptyArray<T> = [T, ...T[]];
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
