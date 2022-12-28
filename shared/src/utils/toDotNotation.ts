export const toDotNotation = (input: object, parentKey?: string) =>
  Object.keys(input || {}).reduce((acc, key): object => {
    const value = input[key as keyof typeof input];
    const outputKey = parentKey ? `${parentKey}.${key}` : `${key}`;
    return value && typeof value === "object"
      ? { ...acc, ...toDotNotation(value, outputKey) }
      : { ...acc, [outputKey]: value };
  }, {});
