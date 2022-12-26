export const toDotNotation = (input: object, parentKey?: string) =>
  Object.keys(input || {}).reduce((acc, key): object => {
    const value = input[key as keyof typeof input];
    const outputKey = parentKey ? `${parentKey}.${key}` : `${key}`;
    if (value && typeof value === "object")
      return { ...acc, ...toDotNotation(value, outputKey) };

    return { ...acc, [outputKey]: value };
  }, {});
