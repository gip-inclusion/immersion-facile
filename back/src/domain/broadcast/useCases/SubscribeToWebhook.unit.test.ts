import {
  expectPromiseToFailWithError,
  expectToEqual,
  SubscriptionParams,
} from "shared";
import { ApiConsumerBuilder } from "../../../_testBuilders/ApiConsumerBuilder";
import {
  createInMemoryUow,
  InMemoryUnitOfWork,
} from "../../../adapters/primary/config/uowConfig";
import { ForbiddenError } from "../../../adapters/primary/helpers/httpErrors";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { SubscribeToWebhook } from "./SubscribeToWebhook";

describe("SubscribeToWebhook", () => {
  let uow: InMemoryUnitOfWork;
  let subscribeToWebhook: SubscribeToWebhook;

  beforeEach(() => {
    uow = createInMemoryUow();
    const uowPerformer = new InMemoryUowPerformer(uow);
    subscribeToWebhook = new SubscribeToWebhook(uowPerformer);
  });

  it("throws a forbidden error when jwtPayload is not provided", async () => {
    await expectPromiseToFailWithError(
      subscribeToWebhook.execute({
        callbackHeaders: { authorization: "lol" },
        callbackUrl: "https://www.lol.com",
        subscribedEvent: "convention.updated",
      }),
      new ForbiddenError("No JWT payload provided"),
    );
  });

  it("adds the subscription", async () => {
    const apiConsumer = new ApiConsumerBuilder()
      .withConventionRight({
        kinds: ["SUBSCRIPTION"],
        scope: { agencyIds: ["yolo"] },
        subscriptions: undefined,
      })
      .build();

    uow.apiConsumerRepository.consumers = [apiConsumer];

    const subscriptionParams: SubscriptionParams = {
      callbackHeaders: { authorization: "lol" },
      callbackUrl: "https://www.lol.com",
    };

    await subscribeToWebhook.execute(
      {
        ...subscriptionParams,
        subscribedEvent: "convention.updated",
      },
      apiConsumer,
    );

    const expectedConsumer = await uow.apiConsumerRepository.getById(
      apiConsumer.id,
    );
    expectToEqual(
      expectedConsumer?.rights.convention.subscriptions?.["convention.updated"],
      subscriptionParams,
    );
  });
});
