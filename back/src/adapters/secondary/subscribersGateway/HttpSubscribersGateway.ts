import axios, { AxiosInstance } from "axios";
import { castError, SubscriptionParams } from "shared";
import {
  ConventionUpdatedSubscriptionCallbackBody,
  SubscribersGateway,
} from "../../../domain/broadcast/ports/SubscribersGateway";
import { createLogger } from "../../../utils/logger";
import { notifyObjectDiscord } from "../../../utils/notifyDiscord";

const logger = createLogger(__filename);

export class HttpSubscribersGateway implements SubscribersGateway {
  #axios: AxiosInstance;

  constructor(axios: AxiosInstance) {
    this.#axios = axios;
  }

  public async notify(
    { payload, subscribedEvent }: ConventionUpdatedSubscriptionCallbackBody,
    { callbackUrl, callbackHeaders }: SubscriptionParams,
  ): Promise<void> {
    return this.#axios
      .post(
        callbackUrl,
        {
          payload,
          subscribedEvent,
        },
        {
          headers: callbackHeaders,
        },
      )
      .then((response) => {
        logger.info({
          title: "Partner subscription notified successfully",
          callbackUrl,
          status: response.status,
        });
      })
      .catch((err) => {
        const error = castError(err);
        const errorContext = {
          title: "Partner subscription errored",
          callbackUrl,
          ...(axios.isAxiosError(error)
            ? {
                status: error.response?.status,
                message: error.response?.data as unknown,
              }
            : {
                status: "not an axios error",
                message: error.message,
              }),
        };

        logger.error({ ...errorContext, error });
        notifyObjectDiscord(errorContext);
      });
  }
}
