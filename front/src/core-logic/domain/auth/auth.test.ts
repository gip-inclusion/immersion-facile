import {
  type ConnectedUser,
  ConnectedUserBuilder,
  type Email,
  expectToEqual,
  type FederatedIdentity,
} from "shared";
import type { ConventionParamsInUrl } from "src/app/routes/routeParams/convention";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";
import {
  type AuthState,
  authSlice,
  type FederatedIdentityWithUser,
} from "src/core-logic/domain/auth/auth.slice";
import { connectedUserSelectors } from "src/core-logic/domain/connected-user/connectedUser.selectors";
import { rootAppSlice } from "src/core-logic/domain/rootApp/rootApp.slice";
import {
  createTestStore,
  type TestDependencies,
} from "src/core-logic/storeConfig/createTestStore";
import type { ReduxStore } from "src/core-logic/storeConfig/store";
import { feedbacks } from "../feedback/feedback.content";
import { feedbacksSelectors } from "../feedback/feedback.selectors";

describe("Auth slice", () => {
  const peConnectedFederatedIdentity: FederatedIdentityWithUser = {
    provider: "peConnect",
    token: "123",
    email: "john.doe@mail.com",
    firstName: "John",
    lastName: "Doe",
  };

  const connectedUserFederatedIdentity: FederatedIdentityWithUser = {
    provider: "proConnect",
    token: "123",
    email: "john.doe@mail.com",
    firstName: "John",
    lastName: "Doe",
    idToken: "id-token",
  };

  let store: ReduxStore;
  let dependencies: TestDependencies;

  beforeEach(() => {
    ({ store, dependencies } = createTestStore());
  });

  it("stores the federated identity when someones connects (in store and in device)", () => {
    expectAuthStateToBe({
      afterLoginRedirectionUrl: null,
      federatedIdentityWithUser: null,
      isLoading: true,
      isRequestingLoginByEmail: false,
      requestedEmail: null,
    });

    store.dispatch(
      authSlice.actions.federatedIdentityProvided({
        federatedIdentityWithUser: peConnectedFederatedIdentity,
        feedbackTopic: "auth-global",
      }),
    );

    expectAuthStateToBe({
      afterLoginRedirectionUrl: null,
      federatedIdentityWithUser: peConnectedFederatedIdentity,
      isLoading: false,
      isRequestingLoginByEmail: false,
      requestedEmail: null,
    });

    expectFederatedIdentityInDevice(peConnectedFederatedIdentity);

    expectAuthStateToBe({
      afterLoginRedirectionUrl: null,
      federatedIdentityWithUser: peConnectedFederatedIdentity,
      isLoading: false,
      isRequestingLoginByEmail: false,
      requestedEmail: null,
    });
  });

  it("deletes federatedIdentity & partialConventionInUrl stored in device and in store when asked for, and redirects to provider logout page", () => {
    ({ store, dependencies } = createTestStore({
      auth: {
        isRequestingLoginByEmail: false,
        federatedIdentityWithUser: connectedUserFederatedIdentity,
        afterLoginRedirectionUrl: null,
        isLoading: true,
        requestedEmail: null,
      },
      connectedUser: {
        currentUser: new ConnectedUserBuilder().build(),
        isLoading: false,
        agenciesToReview: [],
      },
    }));
    dependencies.localDeviceRepository.set(
      "federatedIdentityWithUser",
      connectedUserFederatedIdentity,
    );
    dependencies.localDeviceRepository.set("partialConventionInUrl", {
      firstName: "BOB",
    });

    store.dispatch(
      authSlice.actions.federatedIdentityDeletionTriggered({
        mode: "device-and-oauth",
      }),
    );

    expectAuthStateToBe({
      afterLoginRedirectionUrl: null,
      federatedIdentityWithUser: null,
      isLoading: true,
      isRequestingLoginByEmail: false,
      requestedEmail: null,
    });

    dependencies.authGateway.getLogoutUrlResponse$.next(
      "http://yolo-logout.com",
    );
    expectFederatedIdentityInDevice(undefined);
    expectPartialConventionInUrlInDevice(undefined);
    expectToEqual(dependencies.navigationGateway.wentToUrls, [
      "http://yolo-logout.com",
    ]);

    expectAuthStateToBe({
      afterLoginRedirectionUrl: null,
      federatedIdentityWithUser: null,
      isLoading: true,
      isRequestingLoginByEmail: false,
      requestedEmail: null,
    });
    expect(connectedUserSelectors.currentUser(store.getState())).toBe(null);
  });

  it("deletes federatedIdentity & partialConventionInUrl stored in device and in store when asked for without redirects to provider logout page.", () => {
    ({ store, dependencies } = createTestStore({
      auth: {
        isRequestingLoginByEmail: false,
        federatedIdentityWithUser: connectedUserFederatedIdentity,
        afterLoginRedirectionUrl: null,
        isLoading: true,
        requestedEmail: null,
      },
      connectedUser: {
        currentUser: new ConnectedUserBuilder().build(),
        isLoading: false,
        agenciesToReview: [],
      },
    }));
    dependencies.localDeviceRepository.set(
      "federatedIdentityWithUser",
      connectedUserFederatedIdentity,
    );
    dependencies.localDeviceRepository.set("partialConventionInUrl", {
      firstName: "BOB",
    });
    store.dispatch(
      authSlice.actions.federatedIdentityDeletionTriggered({
        mode: "device-only",
      }),
    );

    expectAuthStateToBe({
      afterLoginRedirectionUrl: null,
      federatedIdentityWithUser: null,
      isLoading: true,
      isRequestingLoginByEmail: false,
      requestedEmail: null,
    });

    expectFederatedIdentityInDevice(undefined);
    expectPartialConventionInUrlInDevice(undefined);
    expectToEqual(dependencies.navigationGateway.wentToUrls, []);

    expectAuthStateToBe({
      afterLoginRedirectionUrl: null,
      federatedIdentityWithUser: null,
      isLoading: true,
      isRequestingLoginByEmail: false,
      requestedEmail: null,
    });
    expect(connectedUserSelectors.currentUser(store.getState())).toBe(null);
  });

  it("deletes federatedIdentity & partialConventionInUrl stored in device and in store when asked for without redirects to provider logout page (when provider is not 'proConnect')", () => {
    ({ store, dependencies } = createTestStore({
      auth: {
        isRequestingLoginByEmail: false,
        federatedIdentityWithUser: peConnectedFederatedIdentity,
        afterLoginRedirectionUrl: null,
        isLoading: true,
        requestedEmail: null,
      },
      connectedUser: {
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

    expectAuthStateToBe({
      afterLoginRedirectionUrl: null,
      federatedIdentityWithUser: null,
      isLoading: true,
      isRequestingLoginByEmail: false,
      requestedEmail: null,
    });

    expectFederatedIdentityInDevice(undefined);
    expectPartialConventionInUrlInDevice(undefined);
    expectToEqual(dependencies.navigationGateway.wentToUrls, []);

    expectAuthStateToBe({
      afterLoginRedirectionUrl: null,
      federatedIdentityWithUser: null,
      isLoading: true,
      isRequestingLoginByEmail: false,
      requestedEmail: null,
    });
    expect(connectedUserSelectors.currentUser(store.getState())).toBe(null);
  });

  it("retrieves federatedIdentity if stored in device", () => {
    expectAuthStateToBe({
      afterLoginRedirectionUrl: null,
      federatedIdentityWithUser: null,
      isLoading: true,
      isRequestingLoginByEmail: false,
      requestedEmail: null,
    });

    dependencies.localDeviceRepository.set(
      "federatedIdentityWithUser",
      connectedUserFederatedIdentity,
    );
    store.dispatch(rootAppSlice.actions.appIsReady());

    expectAuthStateToBe({
      afterLoginRedirectionUrl: null,
      federatedIdentityWithUser: connectedUserFederatedIdentity,
      isLoading: false,
      isRequestingLoginByEmail: false,
      requestedEmail: null,
    });

    expectFederatedIdentityInDevice(connectedUserFederatedIdentity);
    const user: ConnectedUser = {
      id: "123",
      email: connectedUserFederatedIdentity.email,
      firstName: connectedUserFederatedIdentity.firstName,
      lastName: connectedUserFederatedIdentity.lastName,
      agencyRights: [],
      dashboards: { agencies: {}, establishments: {} },
      proConnect: {
        externalId: "fake-user-external-id",
        siret: "12345678901234",
      },
      createdAt: new Date().toISOString(),
    };
    dependencies.authGateway.currentUser$.next(user);
    expectToEqual(connectedUserSelectors.currentUser(store.getState()), user);

    expectAuthStateToBe({
      afterLoginRedirectionUrl: null,
      federatedIdentityWithUser: connectedUserFederatedIdentity,
      isLoading: false,
      isRequestingLoginByEmail: false,
      requestedEmail: null,
    });
  });

  it("shouldn't be logged in if no federatedIdentity stored in device", () => {
    dependencies.localDeviceRepository.delete("federatedIdentityWithUser");
    expectAuthStateToBe({
      afterLoginRedirectionUrl: null,
      federatedIdentityWithUser: null,
      isLoading: true,
      isRequestingLoginByEmail: false,
      requestedEmail: null,
    });

    store.dispatch(rootAppSlice.actions.appIsReady());

    expectAuthStateToBe({
      afterLoginRedirectionUrl: null,
      federatedIdentityWithUser: null,
      isLoading: false,
      isRequestingLoginByEmail: false,
      requestedEmail: null,
    });

    expectFederatedIdentityInDevice(undefined);

    expectAuthStateToBe({
      afterLoginRedirectionUrl: null,
      federatedIdentityWithUser: null,
      isLoading: false,
      isRequestingLoginByEmail: false,
      requestedEmail: null,
    });
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
      expectAuthStateToBe({
        afterLoginRedirectionUrl: null,
        federatedIdentityWithUser: null,
        isLoading: true,
        isRequestingLoginByEmail: false,
        requestedEmail: null,
      });

      store.dispatch(
        authSlice.actions.loginByEmailRequested({
          redirectUri: "/if/establishment",
          email,
          feedbackTopic: "login-by-email",
        }),
      );

      expectAuthStateToBe({
        afterLoginRedirectionUrl: null,
        federatedIdentityWithUser: null,
        isLoading: true,
        isRequestingLoginByEmail: true,
        requestedEmail: email,
      });

      dependencies.authGateway.loginByEmailResponse$.next();

      expectAuthStateToBe({
        afterLoginRedirectionUrl: null,
        federatedIdentityWithUser: null,
        isLoading: true,
        isRequestingLoginByEmail: false,
        requestedEmail: email,
      });

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
      expectAuthStateToBe({
        afterLoginRedirectionUrl: null,
        federatedIdentityWithUser: null,
        isLoading: true,
        isRequestingLoginByEmail: false,
        requestedEmail: null,
      });

      store.dispatch(
        authSlice.actions.loginByEmailRequested({
          redirectUri: "/if/establishmentDashboard?discussionId=discussion0",
          email,
          feedbackTopic: "login-by-email",
        }),
      );

      expectAuthStateToBe({
        afterLoginRedirectionUrl: null,
        federatedIdentityWithUser: null,
        isLoading: true,
        isRequestingLoginByEmail: true,
        requestedEmail: email,
      });

      const errorMessage = "Error message";
      dependencies.authGateway.loginByEmailResponse$.error(
        new Error(errorMessage),
      );

      expectAuthStateToBe({
        afterLoginRedirectionUrl: null,
        federatedIdentityWithUser: null,
        isLoading: true,
        isRequestingLoginByEmail: false,
        requestedEmail: email,
      });
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

  const expectAuthStateToBe = (authState: AuthState) => {
    expectToEqual(store.getState().auth, authState);
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
