import { AxiosRequestConfig } from "axios";

import { ConfigurationError, HttpClientError, HttpServerError } from "./errors";

export interface HttpClient {
  get: (config: HttpClientGetConfig) => Promise<HttpResponse>;
  post: (config: HttpClientPostConfig) => Promise<HttpResponse>;
  //get$: (config: HttpClientGetConfig) => Observable<HttpResponse>;
  //post$: (config: HttpClientPostConfig) => Observable<HttpResponse>;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
}

export const getTargetFromPredicate = (
  predicate: (params: any) => AbsoluteUrl,
  targetsUrls: Record<string, (params: any) => AbsoluteUrl>,
): string | never => {
  const target: string | undefined = Object.keys(targetsUrls).find(
    (targetsUrlKey) => targetsUrls[targetsUrlKey] === predicate,
  );
  if (!target)
    throw new ConfigurationError(
      "Invalid configuration: This target predicate does not match any registered target",
    );
  return target;
};

export const isHttpError = (
  error: any,
): error is HttpClientError | HttpServerError =>
  error instanceof HttpClientError || error instanceof HttpServerError;

type Http = "http://" | "https://";
export type AbsoluteUrl = `${Http}${string}`;

export const isHttpClientError = (status: number): boolean =>
  status >= 400 && status < 500;

export const isHttpServerError = (status: number): boolean =>
  status >= 500 && status < 600;

export type TargetUrlsMapper<TargetUrls extends string> = Record<
  TargetUrls,
  (params: any) => AbsoluteUrl
>;

export type ErrorMapper<TargetUrls extends string> = Partial<
  Record<TargetUrls, Partial<Record<string, (error: Error) => Error>>>
>;

// TODO Permettre de retourner data: T si une fct de validation qui fait le typeguard est fournie.
export interface HttpResponse {
  data: unknown;
  status: number;
  statusText: string;
  headers: any;
  config: AdapterConfig;
  request?: any;
}

export type HttpClientPostConfig = {
  target: (params: any) => AbsoluteUrl;
  targetParams?: any;
  data?: string | undefined;
  adapterConfig?: AdapterConfig;
};

export type HttpClientGetConfig = {
  target: (params: any) => AbsoluteUrl;
  targetParams?: any;
  adapterConfig?: AdapterConfig;
};

// Equivalent to axios AxiosRequestConfig for now but port may change over time
export type AdapterConfig = AxiosRequestConfig;
