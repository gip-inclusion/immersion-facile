export const toDotNotation = (input: object, parentKey?: string) =>
  Object.keys(input || {}).reduce((acc, key): object => {
    const value = input[key as keyof typeof input];
    const outputKey = parentKey ? `${parentKey}.${key}` : `${key}`;
    return value && typeof value === "object"
      ? Object.keys(value).length > 0
        ? { ...acc, ...toDotNotation(value, outputKey) }
        : acc
      : { ...acc, [outputKey]: value };
  }, {});
