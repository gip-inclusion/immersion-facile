import {
  type Email,
  type FederatedIdentity,
  type InclusionConnectedUser,
  InclusionConnectedUserBuilder,
  expectToEqual,
} from "shared";
import type { ConventionParamsInUrl } from "src/app/routes/routeParams/convention";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";
import {
  type FederatedIdentityWithUser,
  authSlice,
} from "src/core-logic/domain/auth/auth.slice";
import { inclusionConnectedSelectors } from "src/core-logic/domain/inclusionConnected/inclusionConnected.selectors";
import { rootAppSlice } from "src/core-logic/domain/rootApp/rootApp.slice";
import {
  type TestDependencies,
  createTestStore,
} from "src/core-logic/storeConfig/createTestStore";
import type { ReduxStore } from "src/core-logic/storeConfig/store";
import { feedbacks } from "../feedback/feedback.content";
import { feedbacksSelectors } from "../feedback/feedback.selectors";

const peConnectedFederatedIdentity: FederatedIdentityWithUser = {
  provider: "peConnect",
  token: "123",
  email: "john.doe@mail.com",
  firstName: "John",
  lastName: "Doe",
};

const inclusionConnectedFederatedIdentity: FederatedIdentityWithUser = {
  provider: "proConnect",
  token: "123",
  email: "john.doe@mail.com",
  firstName: "John",
  lastName: "Doe",
  idToken: "inclusion-connect-id-token",
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
      authSlice.actions.federatedIdentityProvided({
        federatedIdentityWithUser: peConnectedFederatedIdentity,
        feedbackTopic: "auth-global",
      }),
    );
    expectFederatedIdentityToEqual(peConnectedFederatedIdentity);
    expectFederatedIdentityInDevice(peConnectedFederatedIdentity);
    expectIsLoadingToBe(false);
  });

  it("deletes federatedIdentity & partialConventionInUrl stored in device and in store when asked for, and redirects to provider logout page", () => {
    ({ store, dependencies } = createTestStore({
      auth: {
        isRequestingLoginByEmail: false,
        federatedIdentityWithUser: inclusionConnectedFederatedIdentity,
        afterLoginRedirectionUrl: null,
        isLoading: true,
      },
      inclusionConnected: {
        currentUser: new InclusionConnectedUserBuilder().build(),
        isLoading: false,
        agenciesToReview: [],
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
      authSlice.actions.federatedIdentityDeletionTriggered({
        mode: "device-and-inclusion",
      }),
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
    expect(inclusionConnectedSelectors.currentUser(store.getState())).toBe(
      null,
    );
  });

  it("deletes federatedIdentity & partialConventionInUrl stored in device and in store when asked for without redirects to provider logout page.", () => {
    ({ store, dependencies } = createTestStore({
      auth: {
        isRequestingLoginByEmail: false,
        federatedIdentityWithUser: inclusionConnectedFederatedIdentity,
        afterLoginRedirectionUrl: null,
        isLoading: true,
      },
      inclusionConnected: {
        currentUser: new InclusionConnectedUserBuilder().build(),
        isLoading: false,
        agenciesToReview: [],
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
      authSlice.actions.federatedIdentityDeletionTriggered({
        mode: "device-only",
      }),
    );

    expectFederatedIdentityToEqual(null);
    expectFederatedIdentityInDevice(undefined);
    expectPartialConventionInUrlInDevice(undefined);
    expectToEqual(dependencies.navigationGateway.wentToUrls, []);
    expect(inclusionConnectedSelectors.currentUser(store.getState())).toBe(
      null,
    );
  });

  it("deletes federatedIdentity & partialConventionInUrl stored in device and in store when asked for without redirects to provider logout page (when provider is not 'proConnect')", () => {
    ({ store, dependencies } = createTestStore({
      auth: {
        isRequestingLoginByEmail: false,
        federatedIdentityWithUser: peConnectedFederatedIdentity,
        afterLoginRedirectionUrl: null,
        isLoading: true,
      },
      inclusionConnected: {
        currentUser: null,
        isLoading: false,
        agenciesToReview: [],
      },
    }));
    dependencies.localDeviceRepository.set(
      "federatedIdentityWithUser",
      peConnectedFederatedIdentity,
    );
    dependencies.localDeviceRepository.set("partialConventionInUrl", {
      firstName: "BOB",
    });
    store.dispatch(
      authSlice.actions.federatedIdentityDeletionTriggered({
        mode: "device-only",
      }),
    );
    expectFederatedIdentityToEqual(null);
    expectFederatedIdentityInDevice(undefined);
    expectPartialConventionInUrlInDevice(undefined);
    expectToEqual(dependencies.navigationGateway.wentToUrls, []);
    expect(inclusionConnectedSelectors.currentUser(store.getState())).toBe(
      null,
    );
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
      proConnect: {
        externalId: "fake-user-external-id",
        siret: "12345678901234",
      },
      createdAt: new Date().toISOString(),
    };
    dependencies.inclusionConnectedGateway.currentUser$.next(icUser);
    expectToEqual(
      inclusionConnectedSelectors.currentUser(store.getState()),
      icUser,
    );
    expectIsLoadingToBe(false);
  });

  it("shouldn't be logged in if no federatedIdentity stored in device", () => {
    expectFederatedIdentityToEqual(null);
    dependencies.localDeviceRepository.delete("federatedIdentityWithUser");
    store.dispatch(rootAppSlice.actions.appIsReady());
    expectFederatedIdentityToEqual(null);
    expectFederatedIdentityInDevice(undefined);
    expectIsLoadingToBe(false);
  });

  it("should store redirection url in device storage", () => {
    const urlToRedirectAfterLogin =
      "https://fake-url.com/after-login-redirection";
    store.dispatch(
      authSlice.actions.saveRedirectionAfterLoginRequested({
        url: urlToRedirectAfterLogin,
      }),
    );
    expect(
      dependencies.sessionDeviceRepository.get("afterLoginRedirectionUrl"),
    ).toEqual(urlToRedirectAfterLogin);
    expect(authSelectors.afterLoginRedirectionUrl(store.getState())).toEqual(
      urlToRedirectAfterLogin,
    );
  });

  it("should clear redirection url from device after login and redirection complete", () => {
    const urlToRedirectAfterLogin =
      "https://fake-url.com/after-login-redirection";
    store.dispatch(
      authSlice.actions.saveRedirectionAfterLoginRequested({
        url: urlToRedirectAfterLogin,
      }),
    );
    expect(authSelectors.afterLoginRedirectionUrl(store.getState())).toEqual(
      urlToRedirectAfterLogin,
    );
    store.dispatch(authSlice.actions.redirectAndClearUrlAfterLoginRequested());
    expect(authSelectors.afterLoginRedirectionUrl(store.getState())).toEqual(
      null,
    );
    expectToEqual(dependencies.navigationGateway.wentToUrls, [
      urlToRedirectAfterLogin,
    ]);
  });

  describe("login by email", () => {
    const email: Email = "email@mail.com";

    it("should handle login by email successfully", () => {
      expectIsRequestingLoginByEmailToBe(false);

      store.dispatch(
        authSlice.actions.loginByEmailRequested({
          page: "establishment",
          email,
          feedbackTopic: "login-by-email",
        }),
      );

      expectIsRequestingLoginByEmailToBe(true);
      dependencies.authGateway.loginByEmailResponse$.next();
      expectIsRequestingLoginByEmailToBe(false);
      expectToEqual(
        feedbacksSelectors.feedbacks(store.getState())["login-by-email"],
        {
          on: "create",
          level: "success",
          // biome-ignore lint/style/noNonNullAssertion: Should crash if not present
          title: feedbacks["login-by-email"]["create.success"]!.title,
          // biome-ignore lint/style/noNonNullAssertion: Should crash if not present
          message: feedbacks["login-by-email"]["create.success"]!.message,
        },
      );
    });

    it("should handle login by email failed", () => {
      expectIsRequestingLoginByEmailToBe(false);

      store.dispatch(
        authSlice.actions.loginByEmailRequested({
          page: "establishment",
          email,
          feedbackTopic: "login-by-email",
        }),
      );

      expectIsRequestingLoginByEmailToBe(true);
      const errorMessage = "Error message";
      dependencies.authGateway.loginByEmailResponse$.error(
        new Error(errorMessage),
      );
      expectIsRequestingLoginByEmailToBe(false);
      expectToEqual(
        feedbacksSelectors.feedbacks(store.getState())["login-by-email"],
        {
          on: "create",
          level: "error",
          // biome-ignore lint/style/noNonNullAssertion: Should crash if not present
          title: feedbacks["login-by-email"]["create.error"]!.title,
          message: errorMessage,
        },
      );
    });
  });

  const expectFederatedIdentityToEqual = (
    expected: FederatedIdentity | null,
  ) => {
    expectToEqual(authSelectors.federatedIdentity(store.getState()), expected);
  };

  const expectIsLoadingToBe = (expected: boolean) => {
    expect(authSelectors.isLoading(store.getState())).toBe(expected);
  };

  const expectIsRequestingLoginByEmailToBe = (expected: boolean) => {
    expect(authSelectors.isRequestingLoginByEmail(store.getState())).toBe(
      expected,
    );
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
