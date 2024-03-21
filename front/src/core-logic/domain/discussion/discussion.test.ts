import {
  DiscussionBuilder,
  DiscussionReadDto,
  discussionToRead,
  expectObjectsToMatch,
} from "shared";
import {
  TestDependencies,
  createTestStore,
} from "src/core-logic/storeConfig/createTestStore";
import type { ReduxStore } from "src/core-logic/storeConfig/store";
import { DiscussionState, discussionSlice } from "./discussion.slice";

describe("Discussion slice", () => {
  let store: ReduxStore;
  let dependencies: TestDependencies;
  const discussionFetchError = new Error("Discussion fetch error.");
  const defaultStartingDiscussionState: DiscussionState = {
    isLoading: false,
    discussion: null,
    fetchError: null,
  };
  const jwt = "my-jwt";
  const discussion: DiscussionReadDto = discussionToRead(
    new DiscussionBuilder().build(),
  );

  beforeEach(() => {
    ({ store, dependencies } = createTestStore());
  });

  it("on discussion fetched missing", () => {
    expectDiscussionState(defaultStartingDiscussionState);

    store.dispatch(
      discussionSlice.actions.fetchDiscussionRequested({
        jwt,
        discussionId: "missing-discussion-id",
      }),
    );

    expectDiscussionState({ isLoading: true });

    feedGatewayWithDiscussionOrError(undefined);

    expectDiscussionState({
      isLoading: false,
      discussion: null,
      fetchError: null,
    });
  });

  it("on discussion fetched successfully", () => {
    expectDiscussionState(defaultStartingDiscussionState);

    store.dispatch(
      discussionSlice.actions.fetchDiscussionRequested({
        jwt,
        discussionId: discussion.id,
      }),
    );

    expectDiscussionState({
      ...defaultStartingDiscussionState,
      isLoading: true,
    });

    feedGatewayWithDiscussionOrError(discussion);

    expectDiscussionState({
      ...defaultStartingDiscussionState,
      discussion,
    });
  });

  it("on discussion fetched failed", () => {
    expectDiscussionState(defaultStartingDiscussionState);

    store.dispatch(
      discussionSlice.actions.fetchDiscussionRequested({
        jwt,
        discussionId: discussion.id,
      }),
    );

    expectDiscussionState({
      ...defaultStartingDiscussionState,
      isLoading: true,
    });

    feedGatewayWithDiscussionOrError(discussionFetchError);

    expectDiscussionState({
      ...defaultStartingDiscussionState,
      fetchError: discussionFetchError.message,
    });
  });

  it("previous discussion in state removed on discussion fetch requested", () => {
    expectDiscussionState(defaultStartingDiscussionState);

    store.dispatch(
      discussionSlice.actions.fetchDiscussionRequested({
        jwt,
        discussionId: discussion.id,
      }),
    );

    feedGatewayWithDiscussionOrError(discussion);

    expectDiscussionState({
      ...defaultStartingDiscussionState,
      discussion,
    });

    store.dispatch(
      discussionSlice.actions.fetchDiscussionRequested({
        jwt,
        discussionId: discussion.id,
      }),
    );

    expectDiscussionState({
      ...defaultStartingDiscussionState,
      isLoading: true,
      discussion: null,
    });
  });

  const feedGatewayWithDiscussionOrError = (
    discussionOrError?: DiscussionReadDto | Error,
  ) => {
    discussionOrError instanceof Error
      ? dependencies.inclusionConnectedGateway.discussion$.error(
          discussionOrError,
        )
      : dependencies.inclusionConnectedGateway.discussion$.next(
          discussionOrError,
        );
  };

  const expectDiscussionState = (discussionState: Partial<DiscussionState>) => {
    expectObjectsToMatch(store.getState().discussion, discussionState);
  };
});
