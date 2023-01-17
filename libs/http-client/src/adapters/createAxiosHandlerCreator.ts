import type { AxiosInstance } from "axios";
import { HandlerCreator } from "../configureHttpClient";

const convertToUrlEncodedFormData = (body: Record<string, unknown>): string =>
  Object.keys(body)
    .map((key) => `${key}=${body[key]}`)
    .join("&");

export const createAxiosHandlerCreator =
  (axios: AxiosInstance): HandlerCreator =>
  (target) =>
  async (params = {}) => {
    const contentType =
      params.headers["Content-Type"] ??
      params.headers["content-type"] ??
      params.headers["Content-type"];

    const isFormUrlencoded =
      contentType === "application/x-www-form-urlencoded";

    const response = await axios.request({
      method: target.method,
      url: target.url,
      data: isFormUrlencoded
        ? convertToUrlEncodedFormData(params.body)
        : params.body,
      params: params.queryParams,
      headers: {
        ...axios.defaults.headers,
        ...params.headers,
      },
    });

    return {
      status: response.status,
      responseBody: response.data,
    };
  };
