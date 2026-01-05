import {
  type ConventionDraftDto,
  type ConventionDraftId,
  expectObjectsToMatch,
  expectToEqual,
} from "shared";
import { feedbacksSelectors } from "src/core-logic/domain/feedback/feedback.selectors";
import {
  createTestStore,
  type TestDependencies,
} from "src/core-logic/storeConfig/createTestStore";
import type { ReduxStore } from "src/core-logic/storeConfig/store";
import {
  type ConventionDraftState,
  conventionDraftSlice,
} from "./conventionDraft.slice";

describe("ConventionDraft slice", () => {
  let store: ReduxStore;
  let dependencies: TestDependencies;

  beforeEach(() => {
    ({ store, dependencies } = createTestStore());
  });

  describe("Fetch convention draft", () => {
    it("fetches a convention draft successfully", () => {
      const conventionDraftId: ConventionDraftId =
        "aaaaac99-9c0b-1aaa-aa6d-6bb9bd38aaaa";
      const conventionDraft: ConventionDraftDto = {
        id: conventionDraftId,
        internshipKind: "immersion",
      };

      expectConventionDraftState({
        isLoading: false,
        conventionDraft: null,
      });

      store.dispatch(
        conventionDraftSlice.actions.fetchConventionDraftRequested({
          conventionDraftId,
          feedbackTopic: "convention-draft",
        }),
      );

      expectConventionDraftState({
        isLoading: true,
        conventionDraft: null,
      });

      dependencies.conventionGateway.conventionDraft$.next(conventionDraft);

      expectConventionDraftState({
        isLoading: false,
        conventionDraft,
      });
    });

    it("stores error when fetching convention draft fails", () => {
      const conventionDraftId: ConventionDraftId =
        "bbbbbc99-9c0b-1bbb-bb6d-6bb9bd38bbbb";
      const errorMessage = "Convention draft not found";

      expectConventionDraftState({
        isLoading: false,
        conventionDraft: null,
      });

      store.dispatch(
        conventionDraftSlice.actions.fetchConventionDraftRequested({
          conventionDraftId,
          feedbackTopic: "convention-draft",
        }),
      );

      expectConventionDraftState({
        isLoading: true,
      });

      dependencies.conventionGateway.conventionDraft$.error(
        new Error(errorMessage),
      );

      expectConventionDraftState({
        isLoading: false,
        conventionDraft: null,
      });

      expectToEqual(
        feedbacksSelectors.feedbacks(store.getState())["convention-draft"],
        {
          level: "error",
          message: errorMessage,
          on: "fetch",
          title: "Problème lors de la récupération du brouillon de convention",
        },
      );
    });
  });

  const expectConventionDraftState = (
    conventionDraftState: Partial<ConventionDraftState>,
  ) => {
    expectObjectsToMatch(
      store.getState().conventionDraft,
      conventionDraftState,
    );
  };
});
