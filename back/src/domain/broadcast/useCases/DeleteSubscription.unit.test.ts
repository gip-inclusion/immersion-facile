import { expectPromiseToFailWithError, expectToEqual } from "shared";
import {
  InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../../adapters/primary/config/uowConfig";
import {
  ForbiddenError,
  NotFoundError,
} from "../../../adapters/primary/helpers/httpErrors";
import { ApiConsumerBuilder } from "../../../adapters/secondary/InMemoryApiConsumerRepository";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { TestUuidGenerator } from "../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import { DeleteSubscription } from "./DeleteSubscription";

describe("DeleteSubscription", () => {
  const uuidGenerator = new TestUuidGenerator();
  let uow: InMemoryUnitOfWork;
  let deleteSubscription: DeleteSubscription;

  beforeEach(() => {
    uow = createInMemoryUow();
    const uowPerformer = new InMemoryUowPerformer(uow);

    deleteSubscription = new DeleteSubscription(uowPerformer);
  });

  it("throws error when apiConsumer does not have the rights", async () => {
    const now = new Date("2023-09-22");
    const subscriptionId = uuidGenerator.new();
    const apiConsumer = new ApiConsumerBuilder()
      .withConventionRight({
        kinds: ["WRITE"],
        scope: { agencyIds: [] },
        subscriptions: [
          {
            id: subscriptionId,
            createdAt: now.toISOString(),
            callbackHeaders: { authorization: "lol" },
            callbackUrl: "https://www.lol.com",
            subscribedEvent: "convention.updated",
          },
        ],
      })
      .build();
    uow.apiConsumerRepository.consumers = [apiConsumer];

    await expectPromiseToFailWithError(
      deleteSubscription.execute(subscriptionId, apiConsumer),
      new ForbiddenError(
        `You do not have the "SUBSCRIPTION" kind associated to the "convention" right`,
      ),
    );
  });

  it("delete a webhook subscription", async () => {
    const now = new Date("2023-09-22");
    const subscriptionId = uuidGenerator.new();
    const apiConsumer = new ApiConsumerBuilder()
      .withConventionRight({
        kinds: ["SUBSCRIPTION"],
        scope: { agencyIds: ["yolo"] },
        subscriptions: [
          {
            id: subscriptionId,
            createdAt: now.toISOString(),
            callbackHeaders: { authorization: "lol" },
            callbackUrl: "https://www.lol.com",
            subscribedEvent: "convention.updated",
          },
        ],
      })
      .build();
    uow.apiConsumerRepository.consumers = [apiConsumer];

    await deleteSubscription.execute(subscriptionId, apiConsumer);

    const expectedConsumer = await uow.apiConsumerRepository.getById(
      apiConsumer.id,
    );
    expectToEqual(expectedConsumer?.rights.convention.subscriptions, []);
  });

  it("throws 404 when subscription not found", async () => {
    const now = new Date("2023-09-22");
    const subscriptionId = "unexisting-id";
    const apiConsumer = new ApiConsumerBuilder()
      .withConventionRight({
        kinds: ["SUBSCRIPTION"],
        scope: { agencyIds: ["yolo"] },
        subscriptions: [
          {
            id: uuidGenerator.new(),
            createdAt: now.toISOString(),
            callbackHeaders: { authorization: "lol" },
            callbackUrl: "https://www.lol.com",
            subscribedEvent: "convention.updated",
          },
        ],
      })
      .build();
    uow.apiConsumerRepository.consumers = [apiConsumer];

    await expectPromiseToFailWithError(
      deleteSubscription.execute(subscriptionId, apiConsumer),
      new NotFoundError(`subscription ${subscriptionId} not found`),
    );
  });
});
