import { AnyObj, EmptyObj, Url, PathParameters } from "./utilityTypes";

type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

type MethodAndUrl<UrlWithParams = Url> = {
  method: HttpMethod;
  url: UrlWithParams;
};

type OptionalFields<Body, QueryParams, Headers, ResponseBody> = {
  validateRequestBody?: (body: unknown) => Body;
  validateQueryParams?: (queryParams: unknown) => QueryParams;
  validateHeaders?: (headers: unknown) => Headers;
  validateResponseBody?: (responseBody: unknown) => ResponseBody;
};

type TargetWithOptionalFields<
  Body = void,
  QueryParams = void,
  Headers = void,
  UrlWithParams = Url,
  ResponseBody = void,
> = MethodAndUrl<UrlWithParams> &
  OptionalFields<Body, QueryParams, Headers, ResponseBody>;

type Target<
  Body = void,
  QueryParams = void,
  Headers = void,
  UrlWithParams = Url,
  ResponseBody = void,
> = MethodAndUrl<UrlWithParams> &
  Required<OptionalFields<Body, QueryParams, Headers, ResponseBody>>;

export type HttpResponse<ResponseBody> = {
  responseBody: ResponseBody;
  status: number;
};

export type UnknownTarget = Target<unknown, unknown, unknown, Url, unknown>;

// prettier-ignore
/* If the body is not void return '{}' (required for union)
 * else return the generic parameter defined for the target
 */
export type HandlerParams<T extends UnknownTarget> =
  (PathParameters<T["url"]> extends EmptyObj ? AnyObj : { urlParams: PathParameters<T["url"]>})
  & (ReturnType<T["validateRequestBody"]> extends void ? AnyObj : { body: ReturnType<T["validateRequestBody"]> })
  & (ReturnType<T["validateQueryParams"]> extends void ? AnyObj : { queryParams: ReturnType<T["validateQueryParams"]> })
  & (ReturnType<T["validateHeaders"]> extends void ? AnyObj : { headers: ReturnType<T["validateHeaders"]> })

export type Handler<T extends UnknownTarget> = (
  params: HandlerParams<T>,
) => Promise<HttpResponse<ReturnType<T["validateResponseBody"]>>>;

export type HttpClient<Targets extends Record<string, UnknownTarget>> = {
  _tag: "http-client";
} & {
  [TargetName in keyof Targets]: (
    // prettier-ignore
    ...params: [
      Target<void, void, void, Targets[TargetName]["url"], any>,
      PathParameters<Targets[TargetName]["url"]>
    ] extends [Targets[TargetName], EmptyObj]
          ? []
          : [HandlerParams<Targets[TargetName]>]
  ) => Promise<
    HttpResponse<ReturnType<Targets[TargetName]["validateResponseBody"]>>
  >;
};
export type HandlerCreator = <T extends UnknownTarget>(target: T) => Handler<T>;

const createThrowIfNotVoid =
  <T>(paramName: string) =>
  (param: unknown): T => {
    if (param === undefined) return undefined as T;
    throw new Error(
      `No validation function provided for ${paramName} validation`,
    );
  };
export const createTarget = <
  Body = void,
  QueryParams = void,
  Headers = void,
  UrlWithParams extends Url = Url,
  ResponseBody = unknown,
>(
  target: TargetWithOptionalFields<
    Body,
    QueryParams,
    Headers,
    UrlWithParams,
    ResponseBody
  >,
): Target<Body, QueryParams, Headers, UrlWithParams, ResponseBody> => ({
  validateRequestBody: createThrowIfNotVoid("requestBody"),
  validateQueryParams: createThrowIfNotVoid("queryParams"),
  validateHeaders: (headers) => headers as Headers,
  validateResponseBody: (responseBody) => responseBody as ResponseBody,
  ...target,
});

export const createTargets = <
  Targets extends Record<string, UnknownTarget>,
>(targets: {
  [TargetName in keyof Targets]: Targets[TargetName];
}) => targets;

export const configureHttpClient =
  (handlerCreator: HandlerCreator) =>
  <Targets extends Record<string, UnknownTarget>>(targets: {
    [TargetName in keyof Targets]: Targets[TargetName];
  }): HttpClient<Targets> =>
    Object.keys(targets).reduce(
      (acc, targetName: keyof typeof targets) => {
        const target = targets[targetName];

        const handler: Handler<any> = async (handlerParams) => {
          const configuredHandler = handlerCreator({
            ...target,
            url: replaceParamsInUrl(target.url, handlerParams?.urlParams),
          });
          return configuredHandler(handlerParams as any);
        };

        return {
          ...acc,
          [targetName]: handler,
        };
      },
      { _tag: "http-client" } as HttpClient<Targets>,
    );

export const replaceParamsInUrl = <UrlToReplace extends Url>(
  path: UrlToReplace,
  params: PathParameters<UrlToReplace> = {} as PathParameters<UrlToReplace>,
): Url => {
  const paramNames = Object.keys(params) as (keyof typeof params)[];
  if (paramNames.length === 0) return path;
  return paramNames.reduce(
    (acc, paramName) =>
      acc.replace(`:${paramName.toString()}`, params[paramName]),
    path as any,
  );
};
