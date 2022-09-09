import { expectToEqual } from "shared/src/expectToEqual";
import { FederatedIdentity } from "shared/src/federatedIdentities/federatedIdentity.dto";
import { Dependencies } from "src/app/config/dependencies";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";
import { authSlice } from "src/core-logic/domain/auth/auth.slice";
import { createTestStore } from "src/core-logic/storeConfig/createTestStore";
import { ReduxStore } from "src/core-logic/storeConfig/store";

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

  it("stores to device storage the federated identity when someones connects", () => {
    expectFederatedIdentityToEqual(null);
    const identity: FederatedIdentity = "peConnect:123";
    store.dispatch(authSlice.actions.federatedIdentityProvided(identity));
    expectFederatedIdentityInDevice(identity);
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
