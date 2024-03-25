import { DiscussionBuilder, DiscussionReadDto, expectToEqual } from "shared";
import { discussionSelectors } from "src/core-logic/domain/discussion/discussion.selectors";
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
  const discussion: DiscussionReadDto = new DiscussionBuilder().buildRead();

  beforeEach(() => {
    ({ store, dependencies } = createTestStore());
  });

  it("on discussion fetched missing", () => {
    expectDiscussionSelector(defaultStartingDiscussionState);

    store.dispatch(
      discussionSlice.actions.fetchDiscussionRequested({
        jwt,
        discussionId: "missing-discussion-id",
      }),
    );

    expectDiscussionSelector({
      ...defaultStartingDiscussionState,
      isLoading: true,
    });

    feedGatewayWithDiscussionOrError(undefined);

    expectDiscussionSelector({
      isLoading: false,
      discussion: null,
      fetchError: null,
    });
  });

  it("on discussion fetched successfully", () => {
    expectDiscussionSelector(defaultStartingDiscussionState);

    store.dispatch(
      discussionSlice.actions.fetchDiscussionRequested({
        jwt,
        discussionId: discussion.id,
      }),
    );

    expectDiscussionSelector({
      ...defaultStartingDiscussionState,
      isLoading: true,
    });

    feedGatewayWithDiscussionOrError(discussion);

    expectDiscussionSelector({
      ...defaultStartingDiscussionState,
      discussion,
    });
  });

  it("on discussion fetched failed", () => {
    expectDiscussionSelector(defaultStartingDiscussionState);

    store.dispatch(
      discussionSlice.actions.fetchDiscussionRequested({
        jwt,
        discussionId: discussion.id,
      }),
    );

    expectDiscussionSelector({
      ...defaultStartingDiscussionState,
      isLoading: true,
    });

    feedGatewayWithDiscussionOrError(discussionFetchError);

    expectDiscussionSelector({
      ...defaultStartingDiscussionState,
      fetchError: discussionFetchError.message,
    });
  });

  it("previous discussion in state removed on discussion fetch requested", () => {
    expectDiscussionSelector(defaultStartingDiscussionState);

    store.dispatch(
      discussionSlice.actions.fetchDiscussionRequested({
        jwt,
        discussionId: discussion.id,
      }),
    );

    feedGatewayWithDiscussionOrError(discussion);

    expectDiscussionSelector({
      ...defaultStartingDiscussionState,
      discussion,
    });

    store.dispatch(
      discussionSlice.actions.fetchDiscussionRequested({
        jwt,
        discussionId: discussion.id,
      }),
    );

    expectDiscussionSelector({
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

  const expectDiscussionSelector = ({
    isLoading,
    discussion,
    fetchError,
  }: DiscussionState) => {
    expectToEqual(discussionSelectors.isLoading(store.getState()), isLoading);
    expectToEqual(discussionSelectors.discussion(store.getState()), discussion);
    expectToEqual(discussionSelectors.fetchError(store.getState()), fetchError);
  };
});
