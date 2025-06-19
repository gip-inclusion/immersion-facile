import { type ApiConsumer, ConventionDtoBuilder, expectToEqual } from "shared";
import { apiConsumerSelectors } from "src/core-logic/domain/apiConsumer/apiConsumer.selector";
import { apiConsumerSlice } from "src/core-logic/domain/apiConsumer/apiConsumer.slice";
import { feedbacksSelectors } from "src/core-logic/domain/feedback/feedback.selectors";
import {
  createTestStore,
  type TestDependencies,
} from "src/core-logic/storeConfig/createTestStore";
import type { ReduxStore } from "src/core-logic/storeConfig/store";

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
    statistics: {
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

  describe("Get Api consumer names", () => {
    it("get Api consumer names by convention", () => {
      const convention = new ConventionDtoBuilder().build();
      expectInitialStateUnchanged();
      store.dispatch(
        apiConsumerSlice.actions.fetchApiConsumerNamesRequested({
          conventionId: convention.id,
          jwt: "my-jwt",
          feedbackTopic: "api-consumer-names",
        }),
      );
      expect(apiConsumerSelectors.isLoading(store.getState())).toBe(true);
      dependencies.conventionGateway.getApiConsumersByconventionResult$.next([
        "France Travail",
      ]);
      expect(apiConsumerSelectors.isLoading(store.getState())).toBe(false);
      expectToEqual(apiConsumerSelectors.apiConsumerNames(store.getState()), [
        "France Travail",
      ]);
    });

    it("stores error if failure during fetch", () => {
      const convention = new ConventionDtoBuilder().build();
      expectInitialStateUnchanged();
      store.dispatch(
        apiConsumerSlice.actions.fetchApiConsumerNamesRequested({
          conventionId: convention.id,
          jwt: "my-jwt",
          feedbackTopic: "api-consumer-names",
        }),
      );
      expect(apiConsumerSelectors.isLoading(store.getState())).toBe(true);
      dependencies.conventionGateway.getApiConsumersByconventionResult$.error(
        new Error("my-error-message"),
      );
      expect(apiConsumerSelectors.isLoading(store.getState())).toBe(false);

      expectToEqual(feedbacksSelectors.feedbacks(store.getState()), {
        "api-consumer-names": {
          on: "fetch",
          level: "error",
          title: "Problème rencontré",
          message: "my-error-message",
        },
      });
    });

    it("Clear fetched convention", () => {
      ({ store } = createTestStore({
        admin: {
          ...createTestStore().store.getState().admin,
          apiConsumer: {
            apiConsumerNames: ["France Travail"],
            apiConsumers: [],
            isLoading: false,
            lastCreatedToken: null,
          },
        },
      }));
      expectToEqual(apiConsumerSelectors.apiConsumerNames(store.getState()), [
        "France Travail",
      ]);
      store.dispatch(apiConsumerSlice.actions.clearFetchedApiConsumerNames());
      expectToEqual(
        apiConsumerSelectors.apiConsumerNames(store.getState()),
        [],
      );
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
          on: "create",
          level: "success",
          title: "Le consommateur d'API a bien été créé",
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
          on: "update",
          level: "success",
          title: "Le consommateur d'API a bien été mis à jour",
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
          on: "create",
          level: "error",
          title: "Problème lors de la création du consommateur d'API",
          message: errorMessage,
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

  it("clears list of api consumers", () => {
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

    store.dispatch(apiConsumerSlice.actions.clearApiConsumersRequested());

    expect(apiConsumerSelectors.isLoading(store.getState())).toBe(false);
    expectToEqual(apiConsumerSelectors.apiConsumers(store.getState()), []);
  });

  const expectInitialStateUnchanged = () => {
    expectToEqual(apiConsumerSelectors.apiConsumers(store.getState()), []);
    expect(apiConsumerSelectors.isLoading(store.getState())).toBe(false);
    expect(apiConsumerSelectors.lastCreatedToken(store.getState())).toBeNull();
  };
});
