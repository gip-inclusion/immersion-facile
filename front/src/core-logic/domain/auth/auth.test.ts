import { expectToEqual } from "shared/src/expectToEqual";
import { FederatedIdentity } from "shared/src/federatedIdentities/federatedIdentity.dto";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";
import { authSlice } from "src/core-logic/domain/auth/auth.slice";
import { createTestStore } from "src/core-logic/storeConfig/createTestStore";
import { ReduxStore } from "src/core-logic/storeConfig/store";

describe("Auth slice", () => {
  let store: ReduxStore;

  beforeEach(() => {
    ({ store } = createTestStore());
  });

  it("stores the federated identity when someones connects", () => {
    expectFederatedIdentityToEqual(null);
    const identity: FederatedIdentity = "peConnect:123";
    store.dispatch(authSlice.actions.federatedIdentityProvided(identity));
    expectFederatedIdentityToEqual(identity);
  });

  const expectFederatedIdentityToEqual = (
    expected: FederatedIdentity | null,
  ) => {
    expectToEqual(authSelectors.connectedWith(store.getState()), expected);
  };
});
