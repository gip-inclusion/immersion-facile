import { AbsoluteUrl, CallbackHeaders, ConventionReadDto } from "shared";

export type NotifySubscriberParams = {
  convention: ConventionReadDto;
  callbackUrl: AbsoluteUrl;
  callbackHeaders: CallbackHeaders;
};

export interface SubscribersGateway {
  notifyConventionUpdated: (params: {
    convention: ConventionReadDto;
    callbackUrl: AbsoluteUrl;
    callbackHeaders: CallbackHeaders;
  }) => Promise<void>;
}
