type Http = "http://" | "https://";
export type Url = `${Http}${string}`;

type HttpMethod = "GET" | "POST";

type AnyObj = Record<string, unknown>;

export type Target<
  ResponseBody = void,
  Body = void,
  QueryParams = void,
  Headers = void,
> = {
  url: Url;
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

export type TargetVerbAndUrl = Pick<Target, "method" | "url">;

export type CreateEndpoints<T extends Record<string, UnknownTarget>> = T;

export type CreateHttpClient<Targets extends Record<string, UnknownTarget>> = {
  [TargetName in keyof Targets]: (
    /* If the body is not void return '{}' (required for union)
     * else return the generic parameter defined for the target
     */
    // prettier-ignore
    params:
      & (Targets[TargetName]["body"] extends void ? AnyObj : { body: Targets[TargetName]["body"];})
      & (Targets[TargetName]["queryParams"] extends void ? AnyObj : { queryParams: Targets[TargetName]["queryParams"]; })
      & (Targets[TargetName]["headers"] extends void ? AnyObj : { headers: Targets[TargetName]["headers"]; }),
  ) => Promise<HttpResponse<Targets[TargetName]["responseBody"]>>;
};

type ExtractFromExisting<T, K extends T> = Extract<T, K>;

export type Handler = (
  params: Partial<
    Record<
      ExtractFromExisting<keyof Target, "body" | "queryParams" | "headers">,
      any
    >
  >,
) => Promise<HttpResponse<any>>;

export const createHttpClient = <Targets extends Record<string, UnknownTarget>>(
  handlerCreator: (target: TargetVerbAndUrl) => Handler,
  targets: Record<keyof Targets, TargetVerbAndUrl>,
): CreateHttpClient<Targets> =>
  Object.keys(targets).reduce(
    (acc, targetName: keyof typeof targets) => ({
      ...acc,
      [targetName]: handlerCreator(targets[targetName]),
    }),
    {} as CreateHttpClient<Targets>,
  );
