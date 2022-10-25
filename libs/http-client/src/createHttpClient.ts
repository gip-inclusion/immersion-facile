import { AnyObj, EmptyObj, Url, UtilityTypes } from "./utilityTypes";

type HttpMethod = "GET" | "POST";

export type Target<
  ResponseBody = void,
  Body = void,
  QueryParams = void,
  Headers = void,
  UrlWithParams = Url,
> = {
  url: UrlWithParams;
  method: HttpMethod;
  body: Body;
  queryParams: QueryParams;
  responseBody: ResponseBody;
  headers: Headers;
};

export type HttpResponse<ResponseBody> = {
  responseBody: ResponseBody;
  status: number;
};

export type UnknownTarget = Target<unknown, unknown, unknown, unknown>;

export type TargetMethodAndUrl = Pick<Target, "method" | "url">;

export type CreateTargets<T extends Record<string, UnknownTarget>> = T;

export type HttpClient<Targets extends Record<string, UnknownTarget>> = {
  [TargetName in keyof Targets]: (
    /* If the body is not void return '{}' (required for union)
     * else return the generic parameter defined for the target
     */
    // prettier-ignore
    params:
      (UtilityTypes<Targets[TargetName]["url"]> extends EmptyObj ? AnyObj : { params: UtilityTypes<Targets[TargetName]["url"]> })
      & (Targets[TargetName]["body"] extends void ? AnyObj : { body: Targets[TargetName]["body"];})
      & (Targets[TargetName]["queryParams"] extends void ? AnyObj : { queryParams: Targets[TargetName]["queryParams"]; })
      & (Targets[TargetName]["headers"] extends void ? AnyObj : { headers: Targets[TargetName]["headers"]; }),
  ) => Promise<HttpResponse<Targets[TargetName]["responseBody"]>>;
};

type ExtractFromExisting<T, K extends T> = Extract<T, K>;

export type HandlerParams = Partial<
  Record<
    ExtractFromExisting<keyof Target, "body" | "queryParams" | "headers">,
    any
  >
>;

type Handler = (params: HandlerParams) => Promise<HttpResponse<any>>;

export type HandlerCreator = (target: TargetMethodAndUrl) => Handler;

export const createHttpClient = <Targets extends Record<string, UnknownTarget>>(
  handlerCreator: (target: TargetMethodAndUrl) => Handler,
  targets: Record<keyof Targets, TargetMethodAndUrl>,
): HttpClient<Targets> =>
  Object.keys(targets).reduce(
    (acc, targetName: keyof typeof targets) => ({
      ...acc,
      [targetName]: handlerCreator(targets[targetName]),
    }),
    {} as HttpClient<Targets>,
  );
