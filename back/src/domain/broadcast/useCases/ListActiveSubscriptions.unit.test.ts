import { WebhookSubscription, expectPromiseToFailWithError } from "shared";
import {
  InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../../adapters/primary/config/uowConfig";
import { ForbiddenError } from "../../../adapters/primary/helpers/httpErrors";
import { ApiConsumerBuilder } from "../../../adapters/secondary/InMemoryApiConsumerRepository";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { ListActiveSubscriptions } from "./ListActiveSubscriptions";

describe("ListActiveSubscriptions", () => {
  let uow: InMemoryUnitOfWork;
  let listActiveSubscriptions: ListActiveSubscriptions;

  beforeEach(() => {
    uow = createInMemoryUow();
    listActiveSubscriptions = new ListActiveSubscriptions(
      new InMemoryUowPerformer(uow),
    );
  });

  it("throws a forbidden error when jwtPayload is not provided", async () => {
    await expectPromiseToFailWithError(
      listActiveSubscriptions.execute(),
      new ForbiddenError("Accès refusé"),
    );
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
