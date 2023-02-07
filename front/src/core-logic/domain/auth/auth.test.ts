import { expectToEqual, FederatedIdentity } from "shared";
import { Dependencies } from "src/config/dependencies";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";
import { authSlice } from "src/core-logic/domain/auth/auth.slice";
import { createTestStore } from "src/core-logic/storeConfig/createTestStore";
import { ReduxStore } from "src/core-logic/storeConfig/store";
import { appIsReadyAction } from "../actions";

describe("Auth slice", () => {
  let store: ReduxStore;
  let dependencies: Dependencies;

  beforeEach(() => {
    ({ store, dependencies } = createTestStore());
  });

  it("stores the federated identity when someones connects (in store and in device)", () => {
    expectFederatedIdentityToEqual(null);
    const identity: FederatedIdentity = {
      provider: "inclusionConnect",
      token: "123",
    };
    store.dispatch(authSlice.actions.federatedIdentityProvided(identity));
    expectFederatedIdentityToEqual(identity);
    expectFederatedIdentityInDevice(identity);
  });

  it("deletes federatedIdentity stored in device and in store when asked for", () => {
    const federatedIdentity: FederatedIdentity = {
      provider: "peConnect",
      token: "123",
    };
    ({ store, dependencies } = createTestStore({
      auth: { federatedIdentity },
    }));
    dependencies.deviceRepository.set("federatedIdentity", federatedIdentity);
    store.dispatch(authSlice.actions.federatedIdentityDeletionTriggered());
    expectFederatedIdentityToEqual(null);
    expectFederatedIdentityInDevice(undefined);
  });

  it("retrieves federatedIdentity if stored in device", () => {
    expectFederatedIdentityToEqual(null);
    const identity: FederatedIdentity = { provider: "peConnect", token: "123" };
    dependencies.deviceRepository.set("federatedIdentity", identity);
    store.dispatch(appIsReadyAction());
    expectFederatedIdentityToEqual(identity);
    expectFederatedIdentityInDevice(identity);
  });

  it("shouldn't be logged in if no federatedIdentity stored in device", () => {
    expectFederatedIdentityToEqual(null);
    dependencies.deviceRepository.delete("federatedIdentity");
    store.dispatch(appIsReadyAction());
    expectFederatedIdentityToEqual(null);
    expectFederatedIdentityInDevice(undefined);
  });

  const expectFederatedIdentityToEqual = (
    expected: FederatedIdentity | null,
  ) => {
    expectToEqual(authSelectors.federatedIdentity(store.getState()), expected);
  };

  const expectFederatedIdentityInDevice = (
    federatedIdentity: FederatedIdentity | undefined,
  ) => {
    expect(dependencies.deviceRepository.get("federatedIdentity")).toBe(
      federatedIdentity,
    );
  };
});
