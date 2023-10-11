import { PathParameters, SharedRoute, Url } from "shared-routes";
import { UnknownResponses } from "shared-routes/defineRoutes";

export const makeUrlWithParams = <
  U extends Url,
  R extends SharedRoute<U, unknown, unknown, UnknownResponses, unknown>,
>(
  route: R,
  params: PathParameters<R["url"]>,
): Url =>
  route.url.replace(
    /:(\w+)/g,
    (_, paramName) => (params as any)[paramName],
  ) as U;
