import { expectToEqual, FederatedIdentity } from "shared";
import { Dependencies } from "src/app/config/dependencies";
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

  it("stores the federated identity when someones connects", () => {
    expectFederatedIdentityToEqual(null);
    const identity: FederatedIdentity = "peConnect:123";
    store.dispatch(authSlice.actions.federatedIdentityProvided(identity));
    expectFederatedIdentityToEqual(identity);
  });

  it("stores to device storage the federated identity when asked for", () => {
    const identity: FederatedIdentity = "peConnect:123";
    ({ store, dependencies } = createTestStore({
      auth: {
        connectedWith: identity,
      },
    }));
    store.dispatch(
      authSlice.actions.federatedIdentityFromStoreToDeviceStorageTriggered(),
    );
    expectFederatedIdentityInDevice(identity);
  });

  it("deletes federatedIdentity stored in device when asked for", () => {
    const identity: FederatedIdentity = "peConnect:123";
    dependencies.deviceRepository.set("federatedIdentity", identity);
    store.dispatch(
      authSlice.actions.federatedIdentityInDeviceDeletionTriggered(),
    );
    expectFederatedIdentityToEqual(null);
    expectFederatedIdentityInDevice(undefined);
  });

  it("retrieves federatedIdentity if stored in device", () => {
    expectFederatedIdentityToEqual(null);
    const identity: FederatedIdentity = "peConnect:123";
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
    expectToEqual(authSelectors.connectedWith(store.getState()), expected);
  };

  const expectFederatedIdentityInDevice = (
    federatedIdentity: FederatedIdentity | undefined,
  ) => {
    expect(dependencies.deviceRepository.get("federatedIdentity")).toBe(
      federatedIdentity,
    );
  };
});
