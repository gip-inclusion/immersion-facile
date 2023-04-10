import type { AxiosInstance } from "axios";
import { HandlerCreator } from "../configureHttpClient";

export const createAxiosHandlerCreator =
  (axios: AxiosInstance): HandlerCreator =>
  (target) =>
  async (params) => {
    const response = await axios.request({
      method: target.method,
      url: target.url,
      data: params.body,
      params: params.queryParams,
      headers: {
        ...axios.defaults.headers.common,
        ...(params.headers ?? {}),
      },
    });

    return {
      status: response.status,
      responseBody: response.data,
    };
  };
