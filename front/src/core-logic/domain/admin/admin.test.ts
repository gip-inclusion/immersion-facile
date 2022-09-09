import { EmailSentDto } from "shared/src/email/email";
import { AdminToken } from "shared/src/admin/admin.dto";
import { expectToEqual } from "shared/src/expectToEqual";
import { adminSelectors } from "src/core-logic/domain/admin/admin.selectors";
import { adminSlice } from "src/core-logic/domain/admin/admin.slice";
import {
  createTestStore,
  TestDependencies,
} from "src/core-logic/storeConfig/createTestStore";
import { ReduxStore } from "src/core-logic/storeConfig/store";
import { AppIsReadyAction } from "../commonActions";

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
      expectTokenToBe("my-admin-token");
    });

    it("admin fails to log in and gets explicit message", () => {
      store.dispatch(adminSlice.actions.loginRequested(userAndPassword));
      feedAdminGatewayWithError(new Error("Forbidden !"));
      expectIsLoadingToBe(false);
      expectError("Forbidden !");
      expectTokenToBe(null);
    });
  });

  describe("check if already logged in", () => {
    it("appears as logged in if a token is already in device", () => {
      dependencies.deviceRepository.set("adminToken", "already-there-token");
      store.dispatch(AppIsReadyAction());
      expectIsAuthenticatedToBe(true);
      expectTokenToBe("already-there-token");
    });

    it("appears as NOT logged in if a NO token in device", () => {
      dependencies.deviceRepository.delete("adminToken");
      store.dispatch(AppIsReadyAction());
      expectIsAuthenticatedToBe(false);
      expectTokenToBe(null);
    });
  });

  describe("logout", () => {
    it("disconnects the admin user", () => {
      const adminToken = "a-token";

      ({ store, dependencies } = createTestStore({
        admin: { isLoading: false, adminToken, error: null, sentEmails: [] },
      }));

      dependencies.deviceRepository.set("adminToken", adminToken);
      store.dispatch(adminSlice.actions.logoutRequested());
      expectIsAuthenticatedToBe(false);
      expectTokenToBe(null);
      expectAdminTokenInDevice(undefined);
    });
  });

  describe("get latest sent emails", () => {
    it("gets the last emails sent from the backend", () => {
      store.dispatch(adminSlice.actions.lastSentEmailsRequested());
      expectIsLoadingToBe(true);
      const sentEmails: EmailSentDto[] = [
        {
          sentAt: "2022-07-10",
          templatedEmail: {
            type: "EDIT_FORM_ESTABLISHMENT_LINK",
            recipients: ["bob@mail.com"],
            params: { editFrontUrl: "my-url" },
          },
        },
      ];
      feedSentEmailGatewayWithEmails(sentEmails);
      expectSentEmails(sentEmails);
      expectIsLoadingToBe(false);
    });

    it("stores the error when something goes wrong", () => {
      store.dispatch(adminSlice.actions.lastSentEmailsRequested());
      expectIsLoadingToBe(true);
      feedSentEmailGatewayWithError(new Error("Something went wrong"));
      expectError("Something went wrong");
      expectIsLoadingToBe(false);
    });
  });

  const expectIsAuthenticatedToBe = (expected: boolean) => {
    expect(adminSelectors.isAuthenticated(store.getState())).toBe(expected);
  };

  const expectTokenToBe = (expected: AdminToken | null) => {
    expect(adminSelectors.token(store.getState())).toBe(expected);
  };

  const expectIsLoadingToBe = (expected: boolean) => {
    expect(adminSelectors.isLoading(store.getState())).toBe(expected);
  };

  const expectError = (expected: string) => {
    expect(adminSelectors.error(store.getState())).toBe(expected);
  };

  const expectSentEmails = (expected: EmailSentDto[]) => {
    expectToEqual(adminSelectors.sentEmails(store.getState()), expected);
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

  const feedSentEmailGatewayWithEmails = (sentEmails: EmailSentDto[]) => {
    dependencies.sentEmailGateway.sentEmails$.next(sentEmails);
  };

  const feedSentEmailGatewayWithError = (error: Error) => {
    dependencies.sentEmailGateway.sentEmails$.error(error);
  };
});
