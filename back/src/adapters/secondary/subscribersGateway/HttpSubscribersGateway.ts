import { AxiosInstance } from "axios";
import {
  NotifySubscriberParams,
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

  public async notify({
    payload,
    callbackUrl,
    callbackHeaders,
    subscribedEvent,
  }: NotifySubscriberParams): Promise<void> {
    try {
      const response = await this.#axios.post(
        callbackUrl,
        {
          payload,
          subscribedEvent,
        },
        {
          headers: callbackHeaders,
        },
      );
      logger.info({
        title: "Partner subscription notified successfully",
        callbackUrl,
        status: response.status,
      });
    } catch (error: any) {
      const errorContext = {
        title: "Partner subscription errored",
        callbackUrl,
        status: error?.response?.status,
        message: error?.response?.data ?? error.message,
      };

      logger.error({ ...errorContext, error });
      notifyObjectDiscord(errorContext);
    }
  }
}
