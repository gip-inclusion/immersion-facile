export const toDotNotation = (input: object, parentKey?: string) =>
  Object.keys(input || {}).reduce((acc, key): object => {
    const value = input[key as keyof typeof input];
    const outputKey = parentKey ? `${parentKey}.${key}` : `${key}`;

    if (value && typeof value === "object") {
      return Object.keys(value).length > 0
        ? { ...acc, ...toDotNotation(value, outputKey) }
        : acc;
    }

    return { ...acc, [outputKey]: value };
  }, {});
