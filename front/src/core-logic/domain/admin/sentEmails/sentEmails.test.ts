import { EmailSentDto, expectToEqual } from "shared";

import { adminSelectors } from "src/core-logic/domain/admin/admin.selectors";
import { sentEmailsSlice } from "src/core-logic/domain/admin/sentEmails/sentEmails.slice";
import {
  createTestStore,
  TestDependencies,
} from "src/core-logic/storeConfig/createTestStore";
import { ReduxStore } from "src/core-logic/storeConfig/store";

describe("sentEmails slice", () => {
  let store: ReduxStore;
  let dependencies: TestDependencies;

  beforeEach(() => {
    ({ store, dependencies } = createTestStore());
  });

  describe("get latest sent emails", () => {
    it("gets the last emails sent from the backend", () => {
      store.dispatch(sentEmailsSlice.actions.lastSentEmailsRequested());
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
      store.dispatch(sentEmailsSlice.actions.lastSentEmailsRequested());
      expectIsLoadingToBe(true);
      feedSentEmailGatewayWithError(new Error("Something went wrong"));
      expectError("Something went wrong");
      expectIsLoadingToBe(false);
    });
  });

  const expectIsLoadingToBe = (expected: boolean) => {
    expect(adminSelectors.sentEmails.isLoading(store.getState())).toBe(
      expected,
    );
  };

  const expectError = (expected: string) => {
    expect(adminSelectors.sentEmails.error(store.getState())).toBe(expected);
  };

  const expectSentEmails = (expected: EmailSentDto[]) => {
    expectToEqual(
      adminSelectors.sentEmails.sentEmails(store.getState()),
      expected,
    );
  };

  const feedSentEmailGatewayWithEmails = (sentEmails: EmailSentDto[]) => {
    dependencies.sentEmailGateway.sentEmails$.next(sentEmails);
  };

  const feedSentEmailGatewayWithError = (error: Error) => {
    dependencies.sentEmailGateway.sentEmails$.error(error);
  };
});
