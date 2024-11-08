import { HttpClientOptions } from "shared-routes/validations";
import { createLogger } from "../../utils/logger";

const logger = createLogger(__filename);

type LogPartnerResponses = (
  partnerName: string,
) => HttpClientOptions["onResponseSideEffect"];
export const logPartnerResponses: LogPartnerResponses =
  (partnerName) =>
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
            body: response.body,
          },
        },
      });
    }
  };
