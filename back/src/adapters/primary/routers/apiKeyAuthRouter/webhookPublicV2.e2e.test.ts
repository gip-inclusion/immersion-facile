import {
  type ApiConsumer,
  type WebhookSubscription,
  errors,
  expectHttpResponseToEqual,
} from "shared";
import type { HttpClient } from "shared-routes";
import { createSupertestSharedClient } from "shared-routes/supertest";
import type { SuperTest, Test } from "supertest";
import {
  authorizedSubscriptionApiConsumer,
  authorizedUnJeuneUneSolutionApiConsumer,
  unauthorizedApiConsumer,
} from "../../../../domains/core/api-consumer/adapters/InMemoryApiConsumerRepository";
import type { GenerateApiConsumerJwt } from "../../../../domains/core/jwt";
import type { InMemoryUnitOfWork } from "../../../../domains/core/unit-of-work/adapters/createInMemoryUow";
import { buildTestApp } from "../../../../utils/buildTestApp";
import {
  type PublicApiV2WebhooksRoutes,
  publicApiV2WebhooksRoutes,
} from "./publicApiV2.routes";

const unauthorizedSubscriptionApiConsumer =
  authorizedUnJeuneUneSolutionApiConsumer;

describe("Webhook routes", () => {
  let sharedRequest: HttpClient<PublicApiV2WebhooksRoutes>;
  let inMemoryUow: InMemoryUnitOfWork;
  let generateApiConsumerJwt: GenerateApiConsumerJwt;

  beforeEach(async () => {
    let request: SuperTest<Test>;
    ({ request, generateApiConsumerJwt, inMemoryUow } = await buildTestApp());
    sharedRequest = createSupertestSharedClient(
      publicApiV2WebhooksRoutes,
      request,
    );
  });

  describe(`${publicApiV2WebhooksRoutes.subscribeToWebhook.method.toUpperCase()} ${
    publicApiV2WebhooksRoutes.subscribeToWebhook.url
  }`, () => {
    it("201- saves a webhook for authorized consumer", async () => {
      inMemoryUow.apiConsumerRepository.consumers = [
        authorizedSubscriptionApiConsumer,
      ];
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

      expectHttpResponseToEqual(response, {
        status: 201,
        body: "",
      });
    });

    // Wrong paths
    it("403 - rejects unauthenticated requests", async () => {
      inMemoryUow.apiConsumerRepository.consumers = [unauthorizedApiConsumer];
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

      expectHttpResponseToEqual(response, {
        status: 403,
        body: { message: "Accès refusé", status: 403 },
      });
    });
  });

  describe(`${publicApiV2WebhooksRoutes.listActiveSubscriptions.method.toUpperCase()} ${
    publicApiV2WebhooksRoutes.listActiveSubscriptions.url
  }`, () => {
    it("200 - returns the list of active subscriptions for authorized consumer", async () => {
      const subscription: WebhookSubscription = {
        id: "subscription-id",
        callbackHeaders: {
          authorization: "my-cb-auth-header",
        },
        callbackUrl: "https://www.my-service.com/convention-updated",
        subscribedEvent: "convention.updated",
        createdAt: new Date("2022-01-01T12:00:00.000Z").toISOString(),
      };
      const apiConsumersWithSubscriptions: ApiConsumer = {
        ...authorizedSubscriptionApiConsumer,
        rights: {
          convention: {
            kinds: ["SUBSCRIPTION"],
            scope: {
              agencyKinds: [],
            },
            subscriptions: [subscription],
          },
          searchEstablishment: {
            kinds: [],
            scope: "no-scope",
            subscriptions: [],
          },
          statistics: {
            kinds: [],
            scope: "no-scope",
            subscriptions: [],
          },
        },
      };
      inMemoryUow.apiConsumerRepository.consumers = [
        apiConsumersWithSubscriptions,
      ];
      const authToken = generateApiConsumerJwt({
        id: apiConsumersWithSubscriptions.id,
      });

      const response = await sharedRequest.listActiveSubscriptions({
        headers: {
          authorization: authToken,
        },
      });

      expectHttpResponseToEqual(response, {
        status: 200,
        body: [subscription],
      });
    });

    // Wrong paths
    it("403 - rejects unauthenticated requests", async () => {
      inMemoryUow.apiConsumerRepository.consumers = [
        unauthorizedSubscriptionApiConsumer,
      ];
      const authToken = generateApiConsumerJwt({
        id: unauthorizedSubscriptionApiConsumer.id,
      });

      const response = await sharedRequest.listActiveSubscriptions({
        headers: {
          authorization: authToken,
        },
      });

      expectHttpResponseToEqual(response, {
        status: 403,
        body: { message: "Accès refusé", status: 403 },
      });
    });
  });

  describe(`${publicApiV2WebhooksRoutes.unsubscribeToWebhook.method.toUpperCase()} ${
    publicApiV2WebhooksRoutes.subscribeToWebhook.url
  }`, () => {
    it("204 - delete the requested webhook subscription", async () => {
      const subscription: WebhookSubscription = {
        id: "subscription-id",
        callbackHeaders: {
          authorization: "my-cb-auth-header",
        },
        callbackUrl: "https://www.my-service.com/convention-updated",
        subscribedEvent: "convention.updated",
        createdAt: new Date("2022-01-01T12:00:00.000Z").toISOString(),
      };
      const apiConsumersWithSubscriptions: ApiConsumer = {
        ...authorizedSubscriptionApiConsumer,
        rights: {
          convention: {
            kinds: ["SUBSCRIPTION"],
            scope: {
              agencyKinds: [],
            },
            subscriptions: [subscription],
          },
          searchEstablishment: {
            kinds: [],
            scope: "no-scope",
            subscriptions: [],
          },
          statistics: {
            kinds: [],
            scope: "no-scope",
            subscriptions: [],
          },
        },
      };
      inMemoryUow.apiConsumerRepository.consumers = [
        apiConsumersWithSubscriptions,
      ];
      const authToken = generateApiConsumerJwt({
        id: authorizedSubscriptionApiConsumer.id,
      });

      const response = await sharedRequest.unsubscribeToWebhook({
        headers: {
          authorization: authToken,
        },
        urlParams: {
          subscriptionId: subscription.id,
        },
      });

      expectHttpResponseToEqual(response, {
        status: 204,
        body: {},
      });
    });

    it("401 - rejects when unauthorized", async () => {
      const response = await sharedRequest.unsubscribeToWebhook({
        headers: {
          authorization: "incorrect-jwt",
        },
        urlParams: {
          subscriptionId: "subscription-id",
        },
      });

      expectHttpResponseToEqual(response, {
        status: 401,
        body: {
          message: "incorrect Jwt",
          status: 401,
        },
      });
    });

    it("403 - rejects when SUBSCRIPTION kind is not in the rights", async () => {
      const subscription: WebhookSubscription = {
        id: "subscription-id",
        callbackHeaders: {
          authorization: "my-cb-auth-header",
        },
        callbackUrl: "https://www.my-service.com/convention-updated",
        subscribedEvent: "convention.updated",
        createdAt: new Date("2022-01-01T12:00:00.000Z").toISOString(),
      };
      const unauthorizedApiConsumerWithSubscriptions: ApiConsumer = {
        ...unauthorizedApiConsumer,
        rights: {
          convention: {
            kinds: [],
            scope: {
              agencyKinds: [],
            },
            subscriptions: [subscription],
          },
          searchEstablishment: {
            kinds: [],
            scope: "no-scope",
            subscriptions: [],
          },
          statistics: {
            kinds: [],
            scope: "no-scope",
            subscriptions: [],
          },
        },
      };
      inMemoryUow.apiConsumerRepository.consumers = [
        unauthorizedApiConsumerWithSubscriptions,
      ];
      const authToken = generateApiConsumerJwt({
        id: unauthorizedApiConsumerWithSubscriptions.id,
      });

      const response = await sharedRequest.unsubscribeToWebhook({
        headers: {
          authorization: authToken,
        },
        urlParams: {
          subscriptionId: subscription.id,
        },
      });

      expectHttpResponseToEqual(response, {
        status: 403,
        body: {
          message: errors.apiConsumer.missingRights({ rightName: "convention" })
            .message,
          status: 403,
        },
      });
    });
  });
});
