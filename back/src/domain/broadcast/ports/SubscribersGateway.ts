import { AbsoluteUrl, CallbackHeaders, ConventionReadDto } from "shared";

export interface SubscribersGateway {
  notifyConventionUpdated: (params: {
    conventionRead: ConventionReadDto;
    callbackUrl: AbsoluteUrl;
    callbackHeaders: CallbackHeaders;
  }) => Promise<void>;
}
