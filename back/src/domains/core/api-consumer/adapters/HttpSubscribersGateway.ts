import axios, { AxiosError, AxiosInstance } from "axios";
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
                  message: `Not an axios error: '${error.message}'`,
                  error,
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
        subscriberErrorFeedback: errorToFeedback(error),
      }
    : {
        status: undefined,
        subscriberErrorFeedback: { message: error.message, error },
      };

const errorToFeedback = (
  error: AxiosError<any, any>,
): SubscriberErrorFeedback => {
  if (!error.response) return { message: error.message, error };
  if (error.response.data) {
    if (typeof error.response.data === "string")
      return { message: error.response.data, error };
    if (
      typeof error.response.data === "object" &&
      "message" in error.response.data &&
      typeof error.response.data.message === "string"
    ) {
      return { message: error.response.data.message, error };
    }
  }
  return {
    message: "Pas d'informations mais des données techniques disponibles",
    error,
  };
};
