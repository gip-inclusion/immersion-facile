import axios, { AxiosError, AxiosInstance, AxiosResponse } from "axios";
import { SubscriptionParams, castError } from "shared";
import {
  ConventionUpdatedSubscriptionCallbackBody,
  SubscriberErrorFeedback,
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
            ? makeFeedbackFromError(error)
            : {
                status: 500,
                subscriberErrorFeedback: {
                  message: `not an axios error ${error.message}`,
                },
              }),
        };
      });
  }
}

const makeFeedbackFromError = (
  error: AxiosError<any, any>,
): {
  status: number | undefined;
  subscriberErrorFeedback: SubscriberErrorFeedback;
} =>
  error.response
    ? {
        status: error.response.status,
        subscriberErrorFeedback: responseToFeedback(error.response),
      }
    : {
        status: undefined,
        subscriberErrorFeedback: { message: error.message, response: error },
      };

const responseToFeedback = (
  response: AxiosResponse<any, any>,
): SubscriberErrorFeedback => {
  if (response.data) {
    if (typeof response.data === "string") return { message: response.data };
    if (
      typeof response.data === "object" &&
      "message" in response.data &&
      typeof response.data.message === "string"
    ) {
      return { message: response.data.message, response };
    }
  }
  return {
    message: "Pas d'informations mais des données techniques disponibles",
    response,
  };
};
