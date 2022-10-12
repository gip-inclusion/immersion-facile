// TODO: find the standard for gouv.fr phone verification

export const phoneRegExp = /^\+?[0-9]+$/;
export const stringOfNumbers = /^\+?[0-9]+$/;

export type SleepFn = typeof sleep;

// sleep function is use to simulate latency for demo and dev purpose
export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve: any) => {
    setTimeout(resolve, ms);
  });

export type RandomFn = typeof random;
export const random = (max: number): number => Math.floor(Math.random() * max);

export const removeAtIndex = <T>(array: T[], indexToRemove: number): T[] => [
  ...array.slice(0, indexToRemove),
  ...array.slice(indexToRemove + 1),
];

export type TypeFromTuple<T extends unknown[]> = T[number];

export type NotEmptyArray<T> = [T, ...T[]];

export type ExcludeFromExisting<T extends string, K extends T> = Exclude<T, K>;

export type ExtractFromExisting<T, K extends T> = Extract<T, K>;

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

export const exhaustiveCheck = (
  shouldBeNever: never,
  options: { variableName?: string; throwIfReached: boolean },
): never => {
  const unexpectedDataAsString = JSON.stringify({
    ...(options.variableName ? { variableName: options.variableName } : {}),
    value: shouldBeNever,
  });
  const errorMessage = `Should not have been reached, but was reached with : ${unexpectedDataAsString}`;
  // eslint-disable-next-line no-console
  console.error(errorMessage);

  if (options.throwIfReached) throw new Error(errorMessage);
  return shouldBeNever;
};

export type ValueOf<T> = T[keyof T];

type DotPrefix<T extends string> = T extends "" ? "" : `.${T}`;

export type DotNestedKeys<T> = (
  T extends object
    ? {
        [K in Exclude<keyof T, symbol>]: `${K}${DotPrefix<
          DotNestedKeys<T[K]>
        >}`;
      }[Exclude<keyof T, symbol>]
    : ""
) extends infer D
  ? Extract<D, string>
  : never;
