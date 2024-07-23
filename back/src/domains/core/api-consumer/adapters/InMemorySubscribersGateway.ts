import { SubscriptionParams } from "shared";
import {
  ConventionUpdatedSubscriptionCallbackBody,
  SubscriberResponse,
  SubscribersGateway,
} from "../ports/SubscribersGateway";

export type CallbackParams = {
  body: ConventionUpdatedSubscriptionCallbackBody;
  subscriptionParams: SubscriptionParams;
};

export class InMemorySubscribersGateway implements SubscribersGateway {
  #calls: CallbackParams[] = [];

  #simulatedResponse: SubscriberResponse = {
    title: "Partner subscription notified successfully",
    callbackUrl: "http://fake.com",
    conventionStatus: "ACCEPTED_BY_VALIDATOR",
    conventionId: "lala",
    status: 200,
    body: { success: true },
  };

  public get calls(): CallbackParams[] {
    return this.#calls;
  }

  public async notify(
    body: ConventionUpdatedSubscriptionCallbackBody,
    subscriptionParams: SubscriptionParams,
  ): Promise<SubscriberResponse> {
    this.#calls.push({ body, subscriptionParams });
    return this.#simulatedResponse;
  }

  public set simulatedResponse(simulatedResponse: SubscriberResponse) {
    this.#simulatedResponse = simulatedResponse;
  }
}
