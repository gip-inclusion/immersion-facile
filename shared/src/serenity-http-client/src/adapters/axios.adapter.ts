import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
} from "../../../../node_modules/axios";

import {
  AbsoluteUrl,
  ErrorMapper,
  getTargetFromPredicate,
  HttpClient,
  HttpClientGetConfig,
  HttpClientPostConfig,
  HttpResponse,
} from "../httpClient";

import {
  onFullfilledDefaultResponseInterceptorMaker,
  onRejectDefaultResponseInterceptorMaker,
} from "./axios.config";

export type AxiosErrorWithResponse = AxiosError & { response: AxiosResponse };

type AxiosInstanceContext = {
  axiosRequestConfig: AxiosRequestConfig;
  onFulfilledResponseInterceptor: (response: AxiosResponse) => AxiosResponse;
  onRejectResponseInterceptor: (rawAxiosError: AxiosError) => never;
};

export type ContextType<TargetUrls extends string> = {
  config: AxiosRequestConfig;
  target: TargetUrls;
  errorMapper: ErrorMapper<TargetUrls>;
};

export class ManagedAxios<TargetUrls extends string> implements HttpClient {
  constructor(
    //prettier-ignore
    public readonly targetsUrls: Record<TargetUrls, (params?: any) => AbsoluteUrl>,
    //prettier-ignore
    private readonly targetsErrorMapper: ErrorMapper<TargetUrls> = {},
    //prettier-ignore
    private readonly defaultRequestConfig: AxiosRequestConfig = {},
    //prettier-ignore
    private readonly onFulfilledResponseInterceptorMaker:
      (context: ContextType<TargetUrls>) =>
        (response: AxiosResponse) => AxiosResponse =
          onFullfilledDefaultResponseInterceptorMaker,
    //prettier-ignore
    private readonly onRejectResponseInterceptorMaker:
      (context: ContextType<TargetUrls>) =>
        (rawAxiosError: AxiosError) => never =
          onRejectDefaultResponseInterceptorMaker,
  ) {}

  private static workerInstance = (
    context: AxiosInstanceContext,
  ): AxiosInstance => {
    const axiosInstance = axios.create(context.axiosRequestConfig);

    axiosInstance.interceptors.response.use(
      context.onFulfilledResponseInterceptor,
      context.onRejectResponseInterceptor,
    );

    return axiosInstance;
  };

  async get(config: HttpClientGetConfig): Promise<HttpResponse> {
    const {
      axiosRequestConfig,
      onFulfilledResponseInterceptor,
      onRejectResponseInterceptor,
    } = this.clientInstanceContext(config);

    return ManagedAxios.workerInstance({
      axiosRequestConfig,
      onFulfilledResponseInterceptor,
      onRejectResponseInterceptor,
    }).get(config.target(config.targetParams));
  }

  async post(config: HttpClientPostConfig): Promise<HttpResponse> {
    const {
      axiosRequestConfig,
      onFulfilledResponseInterceptor,
      onRejectResponseInterceptor,
    } = this.clientInstanceContext(config);

    return ManagedAxios.workerInstance({
      axiosRequestConfig,
      onFulfilledResponseInterceptor,
      onRejectResponseInterceptor,
    }).post(config.target(config.targetParams), config.data);
  }

  private clientInstanceContext = (
    targetConfig: HttpClientGetConfig,
  ): AxiosInstanceContext => {
    const target: TargetUrls = getTargetFromPredicate(
      targetConfig.target,
      this.targetsUrls,
    ) as TargetUrls;

    const mergedConfigs: AxiosRequestConfig<unknown> = {
      ...this.defaultRequestConfig,
      ...targetConfig,
      headers: {
        ...this.defaultRequestConfig?.headers,
        ...targetConfig.adapterConfig?.headers,
      },
    };

    const context = {
      config: mergedConfigs,
      target,
      errorMapper: this.targetsErrorMapper,
    };

    const onFulfilledResponseInterceptor =
      this.onFulfilledResponseInterceptorMaker(context);
    const onRejectResponseInterceptor =
      this.onRejectResponseInterceptorMaker(context);

    return {
      axiosRequestConfig: mergedConfigs,
      onFulfilledResponseInterceptor,
      onRejectResponseInterceptor,
    };
  };
}
