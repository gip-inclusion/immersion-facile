import {
  expectToEqual,
  FederatedIdentity,
  InclusionConnectedUser,
} from "shared";
import { ConventionParamsInUrl } from "src/app/routes/routeParams/convention";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";
import {
  authSlice,
  FederatedIdentityWithUser,
} from "src/core-logic/domain/auth/auth.slice";
import { inclusionConnectedSelectors } from "src/core-logic/domain/inclusionConnected/inclusionConnected.selectors";
import {
  createTestStore,
  TestDependencies,
} from "src/core-logic/storeConfig/createTestStore";
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
    dependencies.deviceRepository.set(
      "federatedIdentityWithUser",
      inclusionConnectedFederatedIdentity,
    );
    dependencies.deviceRepository.set("partialConventionInUrl", {
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
    dependencies.deviceRepository.set(
      "federatedIdentityWithUser",
      inclusionConnectedFederatedIdentity,
    );
    dependencies.deviceRepository.set("partialConventionInUrl", {
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
    dependencies.deviceRepository.set(
      "federatedIdentityWithUser",
      inclusionConnectedFederatedIdentity,
    );
    store.dispatch(appIsReadyAction());
    expectFederatedIdentityToEqual(inclusionConnectedFederatedIdentity);
    expectFederatedIdentityInDevice(inclusionConnectedFederatedIdentity);
    const icUser: InclusionConnectedUser = {
      id: "123",
      email: inclusionConnectedFederatedIdentity.email,
      firstName: inclusionConnectedFederatedIdentity.firstName,
      lastName: inclusionConnectedFederatedIdentity.lastName,
      agencyRights: [],
      establishmentDashboards: {},
    };
    dependencies.inclusionConnectedGateway.currentUser$.next(icUser);
    expectToEqual(
      inclusionConnectedSelectors.currentUser(store.getState()),
      icUser,
    );
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

  const expectPartialConventionInUrlInDevice = (
    conventionParams: Partial<ConventionParamsInUrl> | undefined,
  ) => {
    expect(dependencies.deviceRepository.get("partialConventionInUrl")).toEqual(
      conventionParams,
    );
  };
});
