import { HttpResponse } from "shared-routes";

export const logBodyAndThrow = <R extends HttpResponse<number, unknown>>({
  body,
}: R): never => {
  const stringifiedBody = JSON.stringify(body, null, 2);
  // eslint-disable-next-line no-console
  console.error(stringifiedBody);
  throw new Error(stringifiedBody);
};

export const otherwiseThrow = (unhandledResponse: never): never => {
  // eslint-disable-next-line no-console
  console.error(JSON.stringify(unhandledResponse, null, 2));
  throw new Error("Une erreur non gérée est survenue", {
    cause: unhandledResponse,
  });
};
