export const otherwiseThrow = (unhandledResponse: never): never => {
  // eslint-disable-next-line no-console
  console.error(JSON.stringify(unhandledResponse, null, 2));
  throw new Error("Une erreur non gérée est survenue", {
    cause: unhandledResponse,
  });
};
