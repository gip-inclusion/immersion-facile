import { AdminToken } from "shared";
import { adminSelectors } from "src/core-logic/domain/admin/admin.selectors";
import {
  adminAuthSlice,
  AdminAuthState,
} from "src/core-logic/domain/admin/adminAuth/adminAuth.slice";
import { adminPreloadedState } from "src/core-logic/domain/admin/adminPreloadedState";
import {
  createTestStore,
  TestDependencies,
} from "src/core-logic/storeConfig/createTestStore";
import { ReduxStore } from "src/core-logic/storeConfig/store";
import { appIsReadyAction } from "../../actions";

const userAndPassword = { user: "yo", password: "lala" };

const initialAdminState: AdminAuthState = {
  isLoading: false,
  adminToken: null,
  error: null,
};

describe("adminAuth slice", () => {
  let store: ReduxStore;
  let dependencies: TestDependencies;

  beforeEach(() => {
    ({ store, dependencies } = createTestStore());
  });

  describe("login", () => {
    it("show its loading when trying to login", () => {
      expectIsLoadingToBe(false);
      expectIsAuthenticatedToBe(false);
      store.dispatch(adminAuthSlice.actions.loginRequested(userAndPassword));
      expectIsLoadingToBe(true);
    });

    it("admin can login successfully and receive the token", () => {
      store.dispatch(adminAuthSlice.actions.loginRequested(userAndPassword));
      feedAdminGatewayWithToken("my-admin-token");
      expectIsLoadingToBe(false);
      expectIsAuthenticatedToBe(true);
      expectAdminTokenInDevice("my-admin-token");
      expectTokenToBe("my-admin-token");
    });

    it("admin fails to log in and gets explicit message", () => {
      store.dispatch(adminAuthSlice.actions.loginRequested(userAndPassword));
      feedAdminGatewayWithError(new Error("Forbidden !"));
      expectIsLoadingToBe(false);
      expectError("Forbidden !");
      expectTokenToBe(null);
    });
  });

  describe("check if already logged in", () => {
    it("appears as logged in if a token is already in device", () => {
      dependencies.deviceRepository.set("adminToken", "already-there-token");
      store.dispatch(appIsReadyAction());
      expectIsAuthenticatedToBe(true);
      expectTokenToBe("already-there-token");
    });

    it("appears as NOT logged in if a NO token in device", () => {
      dependencies.deviceRepository.delete("adminToken");
      store.dispatch(appIsReadyAction());
      expectIsAuthenticatedToBe(false);
      expectTokenToBe(null);
    });
  });

  describe("logout", () => {
    it("disconnects the admin OAuth", () => {
      const adminToken = "a-token";

      ({ store, dependencies } = createTestStore({
        admin: adminPreloadedState({
          adminAuth: { ...initialAdminState, adminToken },
        }),
      }));

      dependencies.deviceRepository.set("adminToken", adminToken);
      store.dispatch(adminAuthSlice.actions.logoutRequested());
      expectIsAuthenticatedToBe(false);
      expectTokenToBe(null);
      expectAdminTokenInDevice(undefined);
    });
  });

  const expectIsAuthenticatedToBe = (expected: boolean) => {
    expect(adminSelectors.auth.isAuthenticated(store.getState())).toBe(
      expected,
    );
  };

  const expectTokenToBe = (expected: AdminToken | null) => {
    expect(adminSelectors.auth.token(store.getState())).toBe(expected);
  };

  const expectIsLoadingToBe = (expected: boolean) => {
    expect(adminSelectors.auth.isLoading(store.getState())).toBe(expected);
  };

  const expectError = (expected: string) => {
    expect(adminSelectors.auth.error(store.getState())).toBe(expected);
  };

  const expectAdminTokenInDevice = (expectedToken: AdminToken | undefined) => {
    expect(dependencies.deviceRepository.get("adminToken")).toBe(expectedToken);
  };

  const feedAdminGatewayWithToken = (token: AdminToken) => {
    dependencies.adminGateway.token$.next(token);
  };

  const feedAdminGatewayWithError = (error: Error) => {
    dependencies.adminGateway.token$.error(error);
  };
});
