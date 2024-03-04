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
  message: string;
};

type NotifyResponseSuccess = NotifyResponseCommon & {
  title: "Partner subscription notified successfully";
};

export type SubscriberResponse = NotifyResponseError | NotifyResponseSuccess;

export interface SubscribersGateway {
  notify: (
    body: ConventionUpdatedSubscriptionCallbackBody,
    subscriptionParams: SubscriptionParams,
  ) => Promise<SubscriberResponse>;
}
