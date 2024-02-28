import { ConventionReadDto, SubscriptionParams } from "shared";

export type ConventionUpdatedSubscriptionCallbackBody = {
  payload: {
    convention: ConventionReadDto;
  };
  subscribedEvent: "convention.updated";
};

export interface SubscribersGateway {
  notify: (
    body: ConventionUpdatedSubscriptionCallbackBody,
    subscriptionParams: SubscriptionParams,
  ) => Promise<void>;
}
