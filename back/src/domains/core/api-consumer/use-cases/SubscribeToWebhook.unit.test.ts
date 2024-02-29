import {
  SubscriptionParams,
  expectPromiseToFailWithError,
  expectToEqual,
} from "shared";
import { ForbiddenError } from "../../../../adapters/primary/helpers/httpErrors";
import { CustomTimeGateway } from "../../time-gateway/adapters/CustomTimeGateway";
import { InMemoryUowPerformer } from "../../unit-of-work/adapters/InMemoryUowPerformer";
import {
  InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../unit-of-work/adapters/createInMemoryUow";
import { TestUuidGenerator } from "../../uuid-generator/adapters/UuidGeneratorImplementations";
import { ApiConsumerBuilder } from "../adapters/InMemoryApiConsumerRepository";
import { SubscribeToWebhook } from "./SubscribeToWebhook";

describe("SubscribeToWebhook", () => {
  let uow: InMemoryUnitOfWork;
  let subscribeToWebhook: SubscribeToWebhook;
  let uuidGenerator: TestUuidGenerator;
  let customTimeGateway: CustomTimeGateway;

  beforeEach(() => {
    uuidGenerator = new TestUuidGenerator();
    customTimeGateway = new CustomTimeGateway();
    uow = createInMemoryUow();
    const uowPerformer = new InMemoryUowPerformer(uow);
    subscribeToWebhook = new SubscribeToWebhook(
      uowPerformer,
      uuidGenerator,
      customTimeGateway,
    );
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
    const now = new Date("2023-09-22");
    customTimeGateway.setNextDate(now);
    const apiConsumer = new ApiConsumerBuilder()
      .withConventionRight({
        kinds: ["SUBSCRIPTION"],
        scope: { agencyIds: ["yolo"] },
        subscriptions: [],
      })
      .build();

    uow.apiConsumerRepository.consumers = [apiConsumer];

    const subscriptionParams: SubscriptionParams = {
      callbackHeaders: { authorization: "lol", operateur: "el-classico" },
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
    expectToEqual(expectedConsumer?.rights.convention.subscriptions, [
      {
        ...subscriptionParams,
        subscribedEvent: "convention.updated",
        id: uuidGenerator.new(),
        createdAt: now.toISOString(),
      },
    ]);
  });
});