import {
  NotifySubscriberParams,
  SubscribersGateway,
} from "../../../domain/broadcast/ports/SubscribersGateway";

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
