import { AxiosError, AxiosResponse } from "axios";
import {
  AbsoluteUrl,
  ConventionId,
  ConventionReadDto,
  ConventionStatus,
  SubscriptionParams,
} from "shared";

export type ConventionUpdatedSubscriptionCallbackBody = {
  payload: {
    convention: ConventionReadDto;
  };
  subscribedEvent: "convention.updated";
};

type NotifyResponseCommon = {
  callbackUrl: AbsoluteUrl;
  conventionId: ConventionId;
  conventionStatus: ConventionStatus;
  status: number | undefined;
};

type NotifyResponseError = NotifyResponseCommon & {
  title: "Partner subscription errored";
  feedback: Feedback;
};

type NotifyResponseSuccess = NotifyResponseCommon & {
  title: "Partner subscription notified successfully";
};

export type SubscriberResponse = NotifyResponseError | NotifyResponseSuccess;
export type Feedback = {
  message: string;
  response?: AxiosResponse<any, any> | AxiosError<any, any>;
};

export interface SubscribersGateway {
  notify: (
    body: ConventionUpdatedSubscriptionCallbackBody,
    subscriptionParams: SubscriptionParams,
  ) => Promise<SubscriberResponse>;
}
