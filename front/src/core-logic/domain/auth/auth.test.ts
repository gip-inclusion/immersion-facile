import { expectToEqual, FederatedIdentity } from "shared";
import { Dependencies } from "src/config/dependencies";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";
import {
  authSlice,
  FederatedIdentityWithUser,
} from "src/core-logic/domain/auth/auth.slice";
import { createTestStore } from "src/core-logic/storeConfig/createTestStore";
import { ReduxStore } from "src/core-logic/storeConfig/store";
import { appIsReadyAction } from "../actions";

const peConnectedFederatedIdentity: FederatedIdentityWithUser = {
  provider: "peConnect",
  token: "123",
  email: "john.doe@mail.com",
  firstName: "John",
  lastName: "Doe",
};

const inclusionConnectedFederatedIdentity: FederatedIdentityWithUser = {
  provider: "inclusionConnect",
  token: "123",
  email: "john.doe@mail.com",
  firstName: "John",
  lastName: "Doe",
};

describe("Auth slice", () => {
  let store: ReduxStore;
  let dependencies: Dependencies;

  beforeEach(() => {
    ({ store, dependencies } = createTestStore());
  });

  it("stores the federated identity when someones connects (in store and in device)", () => {
    expectFederatedIdentityToEqual(null);
    store.dispatch(
      authSlice.actions.federatedIdentityProvided(
        inclusionConnectedFederatedIdentity,
      ),
    );
    expectFederatedIdentityToEqual(inclusionConnectedFederatedIdentity);
    expectFederatedIdentityInDevice(inclusionConnectedFederatedIdentity);
  });

  it("deletes federatedIdentity stored in device and in store when asked for", () => {
    ({ store, dependencies } = createTestStore({
      auth: { federatedIdentityWithUser: peConnectedFederatedIdentity },
    }));
    dependencies.deviceRepository.set(
      "federatedIdentityWithUser",
      peConnectedFederatedIdentity,
    );
    store.dispatch(authSlice.actions.federatedIdentityDeletionTriggered());
    expectFederatedIdentityToEqual(null);
    expectFederatedIdentityInDevice(undefined);
  });

  it("retrieves federatedIdentity if stored in device", () => {
    expectFederatedIdentityToEqual(null);
    dependencies.deviceRepository.set(
      "federatedIdentityWithUser",
      peConnectedFederatedIdentity,
    );
    store.dispatch(appIsReadyAction());
    expectFederatedIdentityToEqual(peConnectedFederatedIdentity);
    expectFederatedIdentityInDevice(peConnectedFederatedIdentity);
  });

  it("shouldn't be logged in if no federatedIdentity stored in device", () => {
    expectFederatedIdentityToEqual(null);
    dependencies.deviceRepository.delete("federatedIdentityWithUser");
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
    expect(
      dependencies.deviceRepository.get("federatedIdentityWithUser"),
    ).toEqual(federatedIdentity);
  };
});
