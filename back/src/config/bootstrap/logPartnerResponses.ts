import type { HttpClientOptions } from "shared-routes/validations";
import { createLogger } from "../../utils/logger";

const logger = createLogger(__filename);

type Input = {
  body?: unknown;
  queryParams?: unknown;
  urlParams?: unknown;
};

export type LogInputCbOnSuccess = (input: Input) => Input;

type LogPartnerResponses = (params: {
  partnerName: string;
  logInputCbOnSuccess?: LogInputCbOnSuccess;
}) => HttpClientOptions["onResponseSideEffect"];
export const logPartnerResponses: LogPartnerResponses =
  ({ partnerName, logInputCbOnSuccess }) =>
  ({ response, route, durationInMs, input }) => {
    const common = {
      partnerName: partnerName,
      route: {
        method: route.method,
        url: route.url,
      },
      durationInMs,
    };

    if (response.status >= 200 && response.status < 400) {
      logger.info({
        partnerApiCall: {
          ...common,
          response: {
            kind: "success",
            status: response.status,
            ...(logInputCbOnSuccess
              ? { input: logInputCbOnSuccess(input) }
              : {}),
          },
        },
      });
    } else {
      logger.error({
        partnerApiCall: {
          ...common,
          response: {
            kind: "failure",
            status: response.status,
            input,
            headers: response.headers,
            body: response.body,
          },
        },
      });
    }
  };
