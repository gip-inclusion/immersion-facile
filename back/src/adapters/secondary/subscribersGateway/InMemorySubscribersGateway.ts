import { AbsoluteUrl, CallbackHeaders, ConventionReadDto } from "shared";
import { SubscribersGateway } from "../../../domain/broadcast/ports/SubscribersGateway";

export type NotifySubscriberParams = {
  conventionRead: ConventionReadDto;
  callbackUrl: AbsoluteUrl;
  callbackHeaders: CallbackHeaders;
};

export class InMemorySubscribersGateway implements SubscribersGateway {
  #calls: NotifySubscriberParams[] = [];

  public get calls(): NotifySubscriberParams[] {
    return this.#calls;
  }

  public async notifyConventionUpdated(
    params: NotifySubscriberParams,
  ): Promise<void> {
    this.#calls.push(params);
  }
}
