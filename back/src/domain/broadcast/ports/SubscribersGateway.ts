import { AbsoluteUrl, CallbackHeaders, SubscriptionEvent } from "shared";

export type NotifySubscriberParams = {
  subscribedEvent: SubscriptionEvent;
  payload: unknown;
  callbackUrl: AbsoluteUrl;
  callbackHeaders: CallbackHeaders;
};

export interface SubscribersGateway {
  notify: (params: NotifySubscriberParams) => Promise<void>;
}
