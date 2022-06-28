import { AdminToken } from "shared/src/admin/admin.dto";
import { adminSelectors } from "src/core-logic/domain/admin/admin.selectors";
import { adminSlice } from "src/core-logic/domain/admin/admin.slice";
import {
  createTestStore,
  TestDependencies,
} from "src/core-logic/storeConfig/createTestStore";
import { ReduxStore } from "src/core-logic/storeConfig/store";

const userAndPassword = { user: "yo", password: "lala" };

describe("admin slice", () => {
  let store: ReduxStore;
  let dependencies: TestDependencies;

  beforeEach(() => {
    ({ store, dependencies } = createTestStore());
  });

  describe("login", () => {
    it("show its loading when trying to login", () => {
      expectIsLoadingToBe(false);
      expectIsAuthenticatedToBe(false);
      store.dispatch(adminSlice.actions.loginRequested(userAndPassword));
      expectIsLoadingToBe(true);
    });

    it("admin can login successfully and receive the token", () => {
      store.dispatch(adminSlice.actions.loginRequested(userAndPassword));
      feedAdminGatewayWithToken("my-admin-token");
      expectIsLoadingToBe(false);
      expectIsAuthenticatedToBe(true);
      expectAdminTokenInDevice("my-admin-token");
    });

    it("admin fails to log in and gets explicit message", () => {
      store.dispatch(adminSlice.actions.loginRequested(userAndPassword));
      feedAdminGatewayWithError(new Error("Forbidden !"));
      expectIsLoadingToBe(false);
      expectError("Forbidden !");
    });
  });

  describe("check if already logged in", () => {
    it("appears as logged in if a token is already in device", () => {
      dependencies.deviceRepository.set("adminToken", "already-there-token");
      store.dispatch(adminSlice.actions.checkIfLoggedInRequested());
      expectIsAuthenticatedToBe(true);
    });

    it("appears as NOT logged in if a NO token in device", () => {
      dependencies.deviceRepository.delete("adminToken");
      store.dispatch(adminSlice.actions.checkIfLoggedInRequested());
      expectIsAuthenticatedToBe(false);
    });
  });

  describe("logout", () => {
    it("disconnects the admin user", () => {
      ({ store, dependencies } = createTestStore(
        {
          admin: { isLoading: false, isAuthenticated: true, error: null },
        },
        "skip",
      ));
      dependencies.deviceRepository.set("adminToken", "a-token");
      store.dispatch(adminSlice.actions.logoutRequested());
      expectIsAuthenticatedToBe(false);
      expectAdminTokenInDevice(undefined);
    });
  });

  const expectIsAuthenticatedToBe = (expected: boolean) => {
    expect(adminSelectors.isAuthenticated(store.getState())).toBe(expected);
  };

  const expectIsLoadingToBe = (expected: boolean) => {
    expect(adminSelectors.isLoading(store.getState())).toBe(expected);
  };

  const expectError = (expected: string) => {
    expect(adminSelectors.error(store.getState())).toBe(expected);
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
