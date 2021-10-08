// TODO: find the standard for gouv.fr phone verification

export const phoneRegExp = /\+?[0-9]*/;

export const sleep = (ms: number) => {
  if (ms <= 0) {
    return;
  }
  return new Promise((r) => setTimeout(r, ms));
};

export const removeAtIndex = <T>(array: T[], indexToRemove: number): T[] => [
  ...array.slice(0, indexToRemove),
  ...array.slice(indexToRemove + 1),
];

export type NotEmptyArray<T> = [T, ...T[]];

export const keys = <T extends string | number | symbol>(
  obj: Partial<Record<T, unknown>>,
): T[] => Object.keys(obj) as T[];
