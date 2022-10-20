export const expectToEqual = <T>(actual: T, expected: T) => {
  expect(actual).toEqual(expected);
};

export const expectObjectsToMatch = <T>(actual: T, expected: Partial<T>) => {
  expect(actual).toMatchObject(expected);
};
// export const expectObjectsToMatch = <T extends Record<any, unknown>>(
//   actual: T,
//   expected: Partial<T>,
// ) => {
//   expect(actual).toMatchObject(expected);
// };
