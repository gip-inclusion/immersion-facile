import { ApiConsumer, expectToEqual } from "shared";
import { apiConsumerSelectors } from "src/core-logic/domain/apiConsumer/apiConsumer.selector";
import { apiConsumerSlice } from "src/core-logic/domain/apiConsumer/apiConsumer.slice";
import {
  createTestStore,
  TestDependencies,
} from "src/core-logic/storeConfig/createTestStore";
import { ReduxStore } from "src/core-logic/storeConfig/store";

const apiConsumer1: ApiConsumer = {
  id: "1",
  consumer: "consumer1",
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
    },
    convention: {
      kinds: [],
      scope: {
        agencyKinds: [],
      },
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
      expectInitialStateToMatch();

      store.dispatch(
        apiConsumerSlice.actions.retrieveApiConsumersRequested("admin-jwt"),
      );
      expect(apiConsumerSelectors.isLoading(store.getState())).toBe(true);

      dependencies.adminGateway.apiConsumers$.next([apiConsumer1]);
      expect(apiConsumerSelectors.isLoading(store.getState())).toBe(false);
      expectToEqual(apiConsumerSelectors.feedback(store.getState()), {
        kind: "success",
      });
      expectToEqual(apiConsumerSelectors.apiConsumers(store.getState()), [
        apiConsumer1,
      ]);
    });

    it("have feedback error on gateway error", () => {
      expectInitialStateToMatch();

      store.dispatch(
        apiConsumerSlice.actions.retrieveApiConsumersRequested("admin-jwt"),
      );
      expect(apiConsumerSelectors.isLoading(store.getState())).toBe(true);

      dependencies.adminGateway.apiConsumers$.error(
        new Error("failed retrieving api consumers"),
      );

      expect(apiConsumerSelectors.isLoading(store.getState())).toBe(false);
      expectToEqual(apiConsumerSelectors.feedback(store.getState()), {
        kind: "errored",
        errorMessage: "failed retrieving api consumers",
      });
    });
  });

  describe("create api consumer", () => {
    it("creates api consumer and get its token", () => {
      const generatedJwt = "super-secret-jwt";

      expectInitialStateToMatch();

      store.dispatch(
        apiConsumerSlice.actions.saveApiConsumerRequested({
          apiConsumer: apiConsumer1,
          adminToken: "admin-jwt",
        }),
      );
      expect(apiConsumerSelectors.isLoading(store.getState())).toBe(true);

      dependencies.adminGateway.createApiConsumersResponse$.next(generatedJwt);
      expect(apiConsumerSelectors.isLoading(store.getState())).toBe(false);

      expectToEqual(apiConsumerSelectors.feedback(store.getState()), {
        kind: "createSuccess",
      });
      expect(apiConsumerSelectors.lastCreatedToken(store.getState())).toBe(
        generatedJwt,
      );
    });

    it("fails on create api consumer gateway error", () => {
      const errorMessage = "failed creating api consumer";

      expectInitialStateToMatch();

      store.dispatch(
        apiConsumerSlice.actions.saveApiConsumerRequested({
          apiConsumer: apiConsumer1,
          adminToken: "adminToken",
        }),
      );
      expect(apiConsumerSelectors.isLoading(store.getState())).toBe(true);

      dependencies.adminGateway.createApiConsumersResponse$.error(
        new Error(errorMessage),
      );
      expect(apiConsumerSelectors.isLoading(store.getState())).toBe(false);

      expectToEqual(apiConsumerSelectors.feedback(store.getState()), {
        kind: "errored",
        errorMessage,
      });
    });
  });

  it("clears last created token", () => {
    const generatedJwt = "super-secret-jwt";
    expectInitialStateToMatch();

    store.dispatch(
      apiConsumerSlice.actions.saveApiConsumerRequested({
        apiConsumer: apiConsumer1,
        adminToken: "admin-jwt",
      }),
    );

    dependencies.adminGateway.createApiConsumersResponse$.next(generatedJwt);

    expect(apiConsumerSelectors.lastCreatedToken(store.getState())).toBe(
      generatedJwt,
    );

    store.dispatch(apiConsumerSlice.actions.clearLastCreatedToken());

    expect(apiConsumerSelectors.lastCreatedToken(store.getState())).toBeNull();
  });

  const expectInitialStateToMatch = () => {
    expectToEqual(apiConsumerSelectors.apiConsumers(store.getState()), []);
    expect(apiConsumerSelectors.isLoading(store.getState())).toBe(false);
    expectToEqual(apiConsumerSelectors.feedback(store.getState()), {
      kind: "idle",
    });
    expect(apiConsumerSelectors.lastCreatedToken(store.getState())).toBeNull();
  };
});
