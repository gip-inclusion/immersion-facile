import {
  FederatedIdentity,
  InclusionConnectedUser,
  expectToEqual,
} from "shared";
import { ConventionParamsInUrl } from "src/app/routes/routeParams/convention";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";
import {
  FederatedIdentityWithUser,
  authSlice,
} from "src/core-logic/domain/auth/auth.slice";
import { inclusionConnectedSelectors } from "src/core-logic/domain/inclusionConnected/inclusionConnected.selectors";
import { rootAppSlice } from "src/core-logic/domain/rootApp/rootApp.slice";
import {
  TestDependencies,
  createTestStore,
} from "src/core-logic/storeConfig/createTestStore";
import { ReduxStore } from "src/core-logic/storeConfig/store";

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
  let dependencies: TestDependencies;

  beforeEach(() => {
    ({ store, dependencies } = createTestStore());
  });

  it("stores the federated identity when someones connects (in store and in device)", () => {
    expectFederatedIdentityToEqual(null);
    store.dispatch(
      authSlice.actions.federatedIdentityProvided(peConnectedFederatedIdentity),
    );
    expectFederatedIdentityToEqual(peConnectedFederatedIdentity);
    expectFederatedIdentityInDevice(peConnectedFederatedIdentity);
  });

  it("deletes federatedIdentity & partialConventionInUrl stored in device and in store when asked for, and redirects to provider logout page", () => {
    ({ store, dependencies } = createTestStore({
      auth: {
        federatedIdentityWithUser: inclusionConnectedFederatedIdentity,
      },
    }));
    dependencies.localDeviceRepository.set(
      "federatedIdentityWithUser",
      inclusionConnectedFederatedIdentity,
    );
    dependencies.localDeviceRepository.set("partialConventionInUrl", {
      firstName: "BOB",
    });
    store.dispatch(
      authSlice.actions.federatedIdentityDeletionTriggered("agencyDashboard"),
    );
    dependencies.inclusionConnectedGateway.getLogoutUrlResponse$.next(
      "http://yolo-logout.com",
    );
    expectFederatedIdentityToEqual(null);
    expectFederatedIdentityInDevice(undefined);
    expectPartialConventionInUrlInDevice(undefined);
    expectToEqual(dependencies.navigationGateway.wentToUrls, [
      "http://yolo-logout.com",
    ]);
  });

  it("deletes federatedIdentity & partialConventionInUrl stored in device and in store when asked for without redirects to provider logout page", () => {
    ({ store, dependencies } = createTestStore({
      auth: {
        federatedIdentityWithUser: inclusionConnectedFederatedIdentity,
      },
    }));
    dependencies.localDeviceRepository.set(
      "federatedIdentityWithUser",
      inclusionConnectedFederatedIdentity,
    );
    dependencies.localDeviceRepository.set("partialConventionInUrl", {
      firstName: "BOB",
    });
    store.dispatch(
      authSlice.actions.federatedIdentityDeletionTriggered("other"),
    );
    expectFederatedIdentityToEqual(null);
    expectFederatedIdentityInDevice(undefined);
    expectPartialConventionInUrlInDevice(undefined);
    expectToEqual(dependencies.navigationGateway.wentToUrls, []);
  });

  it("retrieves federatedIdentity if stored in device", () => {
    expectFederatedIdentityToEqual(null);
    dependencies.localDeviceRepository.set(
      "federatedIdentityWithUser",
      inclusionConnectedFederatedIdentity,
    );
    store.dispatch(rootAppSlice.actions.appIsReady());
    expectFederatedIdentityToEqual(inclusionConnectedFederatedIdentity);
    expectFederatedIdentityInDevice(inclusionConnectedFederatedIdentity);
    const icUser: InclusionConnectedUser = {
      id: "123",
      email: inclusionConnectedFederatedIdentity.email,
      firstName: inclusionConnectedFederatedIdentity.firstName,
      lastName: inclusionConnectedFederatedIdentity.lastName,
      agencyRights: [],
      dashboards: { agencies: {}, establishments: {} },
      externalId: "fake-user-external-id",
      createdAt: new Date().toISOString(),
    };
    dependencies.inclusionConnectedGateway.currentUser$.next(icUser);
    expectToEqual(
      inclusionConnectedSelectors.currentUser(store.getState()),
      icUser,
    );
  });

  it("shouldn't be logged in if no federatedIdentity stored in device", () => {
    expectFederatedIdentityToEqual(null);
    dependencies.localDeviceRepository.delete("federatedIdentityWithUser");
    store.dispatch(rootAppSlice.actions.appIsReady());
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
      dependencies.localDeviceRepository.get("federatedIdentityWithUser"),
    ).toEqual(federatedIdentity);
  };

  const expectPartialConventionInUrlInDevice = (
    conventionParams: Partial<ConventionParamsInUrl> | undefined,
  ) => {
    expect(
      dependencies.localDeviceRepository.get("partialConventionInUrl"),
    ).toEqual(conventionParams);
  };
});
