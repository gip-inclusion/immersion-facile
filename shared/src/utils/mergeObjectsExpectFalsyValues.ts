import { keys } from "ramda";

export const mergeObjectsExceptFalsyValues = <T>(
  partialObj: Partial<T>,
  priorityObj: Partial<T>,
): Partial<T> => {
  const allKeys = [
    ...new Set([...keys(priorityObj), ...keys(partialObj)]),
  ] as (keyof T)[];

  return allKeys.reduce((acc, key) => {
    const priorityValue: any | boolean = priorityObj[key];
    return {
      ...acc,
      [key]:
        priorityValue || priorityValue === false
          ? priorityValue
          : partialObj[key],
    };
  }, {} as T);
};
