export const expectPromiseToFailWith = async (
  promise: Promise<unknown>,
  errorMessage: string
) => {
  await expect(promise).rejects.toThrowError(new Error(errorMessage));
};
