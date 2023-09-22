import { expectToEqual } from "shared";
import { createSupertestSharedClient } from "shared-routes/supertest";
import { buildTestApp } from "../../../../_testBuilders/buildTestApp";
import {
  authorizedSubscriptionApiConsumer,
  unauthorizedApiConsumer,
} from "../../../secondary/InMemoryApiConsumerRepository";
import { publicApiV2WebhooksRoutes } from "./publicApiV2.routes";

describe("Webhook routes", () => {
  it("saves a webhook for authorized consumer", async () => {
    const { request, generateApiConsumerJwt, inMemoryUow } =
      await buildTestApp();
    inMemoryUow.apiConsumerRepository.consumers = [
      authorizedSubscriptionApiConsumer,
    ];
    const sharedRequest = createSupertestSharedClient(
      publicApiV2WebhooksRoutes,
      request,
    );
    const authToken = generateApiConsumerJwt({
      id: authorizedSubscriptionApiConsumer.id,
    });

    const response = await sharedRequest.subscribeToWebhook({
      headers: {
        authorization: authToken,
      },
      body: {
        callbackHeaders: {
          authorization: "Bearer some-string-provided-by-consumer",
        },
        callbackUrl:
          "https://some-url-provided-by-consumer.com/on-convention-updated",
        subscribedEvent: "convention.updated",
      },
    });

    expectToEqual(response, {
      status: 201,
      body: "",
    });
  });

  // Wrong paths
  it("rejects unauthenticated requests", async () => {
    const { request, generateApiConsumerJwt, inMemoryUow } =
      await buildTestApp();
    inMemoryUow.apiConsumerRepository.consumers = [unauthorizedApiConsumer];
    const sharedRequest = createSupertestSharedClient(
      publicApiV2WebhooksRoutes,
      request,
    );
    const authToken = generateApiConsumerJwt({
      id: unauthorizedApiConsumer.id,
    });

    const response = await sharedRequest.subscribeToWebhook({
      headers: {
        authorization: authToken,
      },
      body: {
        callbackHeaders: {
          authorization: "Bearer some-string-provided-by-consumer",
        },
        callbackUrl:
          "https://some-url-provided-by-consumer.com/on-convention-updated",
        subscribedEvent: "convention.updated",
      },
    });

    expect(response).toEqual({
      status: 403,
      body: { message: "Accès refusé", status: 403 },
    });
  });
});
