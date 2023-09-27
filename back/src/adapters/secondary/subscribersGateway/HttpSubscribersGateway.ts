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

  public async notifyConventionUpdated({
    convention,
    callbackUrl,
    callbackHeaders,
  }: NotifySubscriberParams): Promise<void> {
    try {
      await this.#axios.post(callbackUrl, convention, {
        headers: callbackHeaders,
      });
    } catch (error: any) {
      const errorContext = {
        title: "Partner subscription errored",
        callbackUrl,
        conventionId: convention.id,
        status: error?.response?.status,
        message: error?.response?.data ?? error.message,
      };

      logger.error({ ...errorContext, error });
      notifyObjectDiscord(errorContext);
    }
  }
}
