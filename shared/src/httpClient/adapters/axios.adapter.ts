import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
} from "axios";
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

type ContextType<TargetUrls extends string> = {
  config: AxiosRequestConfig;
  target: TargetUrls;
  errorMapper: ErrorMapper<TargetUrls>;
};

export class ManagedAxios<TargetUrls extends string> implements HttpClient {
  constructor(
    //prettier-ignore
    private readonly targetsUrls: Record<TargetUrls, (params: any) => AbsoluteUrl>,
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

    //TODO Add request interceptors ?
    /*    axiosInstance.interceptors.request.use(
      axiosValidRequestInterceptor(targetsUrlsMapper),
      axiosErrorRequestInterceptor,
    );*/

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
    const mergedConfigs = { ...this.defaultRequestConfig, ...targetConfig };
    const onFulfilledResponseInterceptor =
      this.onFulfilledResponseInterceptorMaker({
        config: { ...this.defaultRequestConfig, ...targetConfig },
        target,
        errorMapper: this.targetsErrorMapper,
      });

    const onRejectResponseInterceptor = this.onRejectResponseInterceptorMaker({
      config: { ...this.defaultRequestConfig, ...targetConfig },
      target,
      errorMapper: this.targetsErrorMapper,
    });

    return {
      axiosRequestConfig: mergedConfigs,
      onFulfilledResponseInterceptor,
      onRejectResponseInterceptor,
    };
  };
}
