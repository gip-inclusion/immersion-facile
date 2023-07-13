import type { AxiosInstance } from "axios";
import { HandlerCreator } from "../configureHttpClient";

export const createAxiosHandlerCreator =
  (axios: AxiosInstance): HandlerCreator =>
  (target) =>
  async (params = {} as any) => {
    const body = target.validateRequestBody(params.body);
    const queryParams = target.validateQueryParams(params.queryParams);
    const headers = target.validateHeaders(params.headers);

    const response = await axios.request({
      method: target.method,
      url: target.url,
      responseType: target.responseType,
      data: body,
      params: queryParams,
      headers: {
        ...axios.defaults.headers.common,
        ...(headers ?? {}),
      },
    });

    return {
      status: response.status,
      responseBody: target.validateResponseBody(response.data) as any,
    };
  };
