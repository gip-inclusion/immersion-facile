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
        agencyIds: [],
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

  it("fetches api consumer", () => {
    expectInitialStateToMatch();

    store.dispatch(apiConsumerSlice.actions.retrieveApiConsumersRequested());
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

    store.dispatch(apiConsumerSlice.actions.retrieveApiConsumersRequested());
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

  const expectInitialStateToMatch = () => {
    expectToEqual(apiConsumerSelectors.apiConsumers(store.getState()), []);
    expect(apiConsumerSelectors.isLoading(store.getState())).toBe(false);
    expectToEqual(apiConsumerSelectors.feedback(store.getState()), {
      kind: "idle",
    });
  };
});
