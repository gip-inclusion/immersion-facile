import { ApiConsumer, expectToEqual } from "shared";
import { apiConsumerSelectors } from "src/core-logic/domain/apiConsumer/apiConsumer.selector";
import { apiConsumerSlice } from "src/core-logic/domain/apiConsumer/apiConsumer.slice";
import { feedbacksSelectors } from "src/core-logic/domain/feedback/feedback.selectors";
import {
  TestDependencies,
  createTestStore,
} from "src/core-logic/storeConfig/createTestStore";
import { ReduxStore } from "src/core-logic/storeConfig/store";

const apiConsumer1: ApiConsumer = {
  id: "1",
  name: "consumer1",
  contact: {
    lastName: "Jean",
    firstName: "Bonneau",
    job: "développeur",
    phone: "0000000000",
    emails: ["jean@bonneau.com"],
  },
  rights: {
    searchEstablishment: {
      kinds: ["READ"],
      scope: "no-scope",
      subscriptions: [],
    },
    convention: {
      kinds: [],
      scope: {
        agencyKinds: [],
      },
      subscriptions: [],
    },
    establishmentStats: {
      kinds: ["READ"],
      scope: "no-scope",
      subscriptions: [],
    },
  },
  createdAt: new Date().toISOString(),
  expirationDate: new Date().toISOString(),
};

describe("api consumer", () => {
  let store: ReduxStore;
  let dependencies: TestDependencies;

  beforeEach(() => {
    ({ store, dependencies } = createTestStore());
  });

  describe("retrieve api consumers", () => {
    it("fetches api consumer", () => {
      expectInitialStateUnchanged();

      store.dispatch(
        apiConsumerSlice.actions.retrieveApiConsumersRequested("admin-jwt"),
      );
      expect(apiConsumerSelectors.isLoading(store.getState())).toBe(true);

      dependencies.adminGateway.apiConsumers$.next([apiConsumer1]);
      expect(apiConsumerSelectors.isLoading(store.getState())).toBe(false);

      expectToEqual(apiConsumerSelectors.apiConsumers(store.getState()), [
        apiConsumer1,
      ]);
    });

    it("have feedback error on gateway error", () => {
      expectInitialStateUnchanged();

      store.dispatch(
        apiConsumerSlice.actions.retrieveApiConsumersRequested("admin-jwt"),
      );
      expect(apiConsumerSelectors.isLoading(store.getState())).toBe(true);

      dependencies.adminGateway.apiConsumers$.error(
        new Error("failed retrieving api consumers"),
      );

      expect(apiConsumerSelectors.isLoading(store.getState())).toBe(false);
    });
  });

  describe("create api consumer", () => {
    it("creates api consumer and get its token", () => {
      const generatedJwt = "super-secret-jwt";

      expectInitialStateUnchanged();

      store.dispatch(
        apiConsumerSlice.actions.saveApiConsumerRequested({
          apiConsumer: apiConsumer1,
          adminToken: "admin-jwt",
          feedbackTopic: "api-consumer-global",
        }),
      );
      expect(apiConsumerSelectors.isLoading(store.getState())).toBe(true);

      dependencies.adminGateway.saveApiConsumersResponse$.next(generatedJwt);
      expect(apiConsumerSelectors.isLoading(store.getState())).toBe(false);

      expect(apiConsumerSelectors.lastCreatedToken(store.getState())).toBe(
        generatedJwt,
      );
      expectToEqual(feedbacksSelectors.feedbacks(store.getState()), {
        "api-consumer-global": {
          level: "success",
          title: "Le consommateur d'API a bien été créé.",
          message:
            "Le consommateur d'API a bien été créé, il peut commencer à utiliser l'api",
        },
      });
    });

    it("updates an api consumer", () => {
      expectInitialStateUnchanged();

      store.dispatch(
        apiConsumerSlice.actions.saveApiConsumerRequested({
          apiConsumer: apiConsumer1,
          adminToken: "admin-jwt",
          feedbackTopic: "api-consumer-global",
        }),
      );
      expect(apiConsumerSelectors.isLoading(store.getState())).toBe(true);

      dependencies.adminGateway.saveApiConsumersResponse$.next("");
      expect(apiConsumerSelectors.isLoading(store.getState())).toBe(false);

      expect(
        apiConsumerSelectors.lastCreatedToken(store.getState()),
      ).toBeNull();
      expectToEqual(feedbacksSelectors.feedbacks(store.getState()), {
        "api-consumer-global": {
          level: "success",
          title: "Le consommateur d'API a bien été mis à jour.",
          message:
            "Le consommateur d'API a bien été mis à jour, il peut continuer à utiliser l'api",
        },
      });
    });

    it("fails on create api consumer gateway error", () => {
      const errorMessage = "failed creating api consumer";

      expectInitialStateUnchanged();

      store.dispatch(
        apiConsumerSlice.actions.saveApiConsumerRequested({
          apiConsumer: apiConsumer1,
          adminToken: "adminToken",
          feedbackTopic: "api-consumer-global",
        }),
      );
      expect(apiConsumerSelectors.isLoading(store.getState())).toBe(true);

      dependencies.adminGateway.saveApiConsumersResponse$.error(
        new Error(errorMessage),
      );
      expect(apiConsumerSelectors.isLoading(store.getState())).toBe(false);
      expectToEqual(feedbacksSelectors.feedbacks(store.getState()), {
        "api-consumer-global": {
          level: "error",
          title: "Problème lors de la création du consommateur d'API",
          message:
            "Une erreur est survenue lors de la création du consommateur d'API",
        },
      });
    });
  });

  it("clears last created token", () => {
    const generatedJwt = "super-secret-jwt";
    expectInitialStateUnchanged();

    store.dispatch(
      apiConsumerSlice.actions.saveApiConsumerRequested({
        apiConsumer: apiConsumer1,
        adminToken: "admin-jwt",
        feedbackTopic: "api-consumer-global",
      }),
    );

    dependencies.adminGateway.saveApiConsumersResponse$.next(generatedJwt);

    expect(apiConsumerSelectors.lastCreatedToken(store.getState())).toBe(
      generatedJwt,
    );

    store.dispatch(apiConsumerSlice.actions.clearLastCreatedToken());

    expect(apiConsumerSelectors.lastCreatedToken(store.getState())).toBeNull();
  });

  const expectInitialStateUnchanged = () => {
    expectToEqual(apiConsumerSelectors.apiConsumers(store.getState()), []);
    expect(apiConsumerSelectors.isLoading(store.getState())).toBe(false);
    expect(apiConsumerSelectors.lastCreatedToken(store.getState())).toBeNull();
  };
});
