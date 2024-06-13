import { WebhookSubscription } from "shared";
import { InMemoryUowPerformer } from "../../unit-of-work/adapters/InMemoryUowPerformer";
import {
  InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../unit-of-work/adapters/createInMemoryUow";
import { ApiConsumerBuilder } from "../adapters/InMemoryApiConsumerRepository";
import {
  ListActiveSubscriptions,
  makeListActiveSubscriptions,
} from "./ListActiveSubscriptions";

describe("ListActiveSubscriptions", () => {
  let uow: InMemoryUnitOfWork;
  let listActiveSubscriptions: ListActiveSubscriptions;

  beforeEach(() => {
    uow = createInMemoryUow();
    const uowPerformer = new InMemoryUowPerformer(uow);
    listActiveSubscriptions = makeListActiveSubscriptions({ uowPerformer });
  });

  it("returns empty list if no subscriptions", async () => {
    const apiConsumer = new ApiConsumerBuilder()
      .withConventionRight({
        kinds: ["SUBSCRIPTION"],
        scope: { agencyIds: [] },
        subscriptions: [],
      })
      .build();

    const response = await listActiveSubscriptions.execute(
      undefined,
      apiConsumer,
    );

    expect(response).toEqual([]);
  });

  it("returns subscriptions", async () => {
    const dateNow = new Date("2022-01-01T12:00:00.000Z");
    const subscription: WebhookSubscription = {
      id: "some-id",
      createdAt: dateNow.toISOString(),
      callbackHeaders: {
        authorization: "Bearer some-string-provided-by-consumer",
      },
      callbackUrl:
        "https://some-url-provided-by-consumer.com/on-convention-updated",
      subscribedEvent: "convention.updated",
    };
    const apiConsumer = new ApiConsumerBuilder()
      .withConventionRight({
        kinds: ["SUBSCRIPTION"],
        scope: { agencyIds: [] },
        subscriptions: [subscription],
      })
      .build();

    const response = await listActiveSubscriptions.execute(
      undefined,
      apiConsumer,
    );

    expect(response).toEqual([subscription]);
  });
});
