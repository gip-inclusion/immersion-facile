export const expectToEqual = <T>(actual: T, expected: T) => {
  expect(actual).toEqual(expected);
};

export const expectObjectToMatch = <T>(actual: T, expected: Partial<T>) => {
  expect(actual).toMatchObject(expected);
};
