import axios, { AxiosInstance } from "axios";
import { SubscriptionParams, castError } from "shared";
import {
  ConventionUpdatedSubscriptionCallbackBody,
  SubscriberResponse,
  SubscribersGateway,
} from "../ports/SubscribersGateway";

export class HttpSubscribersGateway implements SubscribersGateway {
  #axios: AxiosInstance;

  constructor(axios: AxiosInstance) {
    this.#axios = axios;
  }

  public async notify(
    { payload, subscribedEvent }: ConventionUpdatedSubscriptionCallbackBody,
    { callbackUrl, callbackHeaders }: SubscriptionParams,
  ): Promise<SubscriberResponse> {
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
      .then(
        (response): SubscriberResponse => ({
          title: "Partner subscription notified successfully",
          callbackUrl,
          status: response.status,
          conventionId: payload.convention.id,
          conventionStatus: payload.convention.status,
        }),
      )
      .catch((err): SubscriberResponse => {
        const error = castError(err);
        return {
          title: "Partner subscription errored",
          callbackUrl,
          conventionId: payload.convention.id,
          conventionStatus: payload.convention.status,
          ...(axios.isAxiosError(error)
            ? {
                status: error.response?.status,
                message: error.response?.data,
              }
            : {
                status: 500,
                message: `not an axios error ${error.message}`,
              }),
        };
      });
  }
}
