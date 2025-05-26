import {
  DiscussionBuilder,
  type DiscussionReadDto,
  type Exchange,
  expectToEqual,
} from "shared";
import { discussionSelectors } from "src/core-logic/domain/discussion/discussion.selectors";
import { feedbacksSelectors } from "src/core-logic/domain/feedback/feedback.selectors";
import {
  type TestDependencies,
  createTestStore,
} from "src/core-logic/storeConfig/createTestStore";
import type { ReduxStore } from "src/core-logic/storeConfig/store";
import {
  type DiscussionState,
  type SendMessageRequestedPayload,
  discussionSlice,
} from "./discussion.slice";

describe("Discussion slice", () => {
  let store: ReduxStore;
  let dependencies: TestDependencies;
  const discussionFetchErrorMessage = "Discussion fetch error from API.";
  const discussionFetchError = new Error(discussionFetchErrorMessage);
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
        feedbackTopic: "dashboard-discussion",
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
        feedbackTopic: "dashboard-discussion",
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
        feedbackTopic: "dashboard-discussion",
      }),
    );

    expectDiscussionSelector({
      ...defaultStartingDiscussionState,
      isLoading: true,
    });

    feedGatewayWithDiscussionOrError(discussionFetchError);

    expectDiscussionSelector({
      ...defaultStartingDiscussionState,
    });
    expectToEqual(feedbacksSelectors.feedbacks(store.getState()), {
      "dashboard-discussion": {
        on: "fetch",
        level: "error",
        title: "Problème lors de la récupération des discussions",
        message: discussionFetchErrorMessage,
      },
    });
  });

  it("previous discussion in state removed on discussion fetch requested", () => {
    expectDiscussionSelector(defaultStartingDiscussionState);

    store.dispatch(
      discussionSlice.actions.fetchDiscussionRequested({
        jwt,
        discussionId: discussion.id,
        feedbackTopic: "dashboard-discussion",
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
        feedbackTopic: "dashboard-discussion",
      }),
    );

    expectDiscussionSelector({
      ...defaultStartingDiscussionState,
      isLoading: true,
      discussion: null,
    });
  });

  describe("dashboard discussion reject", () => {
    it("dashboard discussion reject succeeded", () => {
      expectDiscussionSelector(defaultStartingDiscussionState);

      store.dispatch(
        discussionSlice.actions.updateDiscussionStatusRequested({
          jwt,
          discussionId: discussion.id,
          feedbackTopic: "dashboard-discussion-rejection",
          status: "REJECTED",
          rejectionKind: "NO_TIME",
        }),
      );

      expectDiscussionSelector({
        ...defaultStartingDiscussionState,
        isLoading: true,
      });

      dependencies.inclusionConnectedGateway.updateDiscussionStatusResponse$.next();

      expectToEqual(discussionSelectors.isLoading(store.getState()), false);

      expectToEqual(feedbacksSelectors.feedbacks(store.getState()), {
        "dashboard-discussion-rejection": {
          on: "update",
          level: "success",
          title: "La candidature a bien été rejetée",
          message:
            "La candidature a bien été rejetée, un email a été envoyé au candidat",
        },
      });
    });

    it("discussion reject failed", () => {
      expectDiscussionSelector(defaultStartingDiscussionState);

      store.dispatch(
        discussionSlice.actions.updateDiscussionStatusRequested({
          jwt,
          discussionId: discussion.id,
          feedbackTopic: "dashboard-discussion-rejection",
          status: "REJECTED",
          rejectionKind: "NO_TIME",
        }),
      );

      expectDiscussionSelector({
        ...defaultStartingDiscussionState,
        isLoading: true,
      });

      dependencies.inclusionConnectedGateway.updateDiscussionStatusResponse$.error(
        discussionFetchError,
      );

      expectDiscussionSelector({
        ...defaultStartingDiscussionState,
      });
      expectToEqual(feedbacksSelectors.feedbacks(store.getState()), {
        "dashboard-discussion-rejection": {
          on: "update",
          level: "error",
          title: "Problème lors du rejet de la candidature",
          message: discussionFetchErrorMessage,
        },
      });
    });
  });

  describe("send a new exchange on discussion", () => {
    it("send message requested and discussion is not in state", () => {
      expectDiscussionSelector(defaultStartingDiscussionState);
      const exchangePayload: SendMessageRequestedPayload = {
        jwt,
        discussionId: discussion.id,
        message: "My message",
      };

      const expectedExchange: Exchange = {
        message: exchangePayload.message,
        subject: "Réponse de My businessName à votre demande",
        sentAt: new Date().toISOString(),
        sender: "establishment",
        recipient: "potentialBeneficiary",
        attachments: [],
      };

      store.dispatch(
        discussionSlice.actions.sendMessageRequested({
          exchangeData: exchangePayload,
          feedbackTopic: "establishment-dashboard-discussion-send-message",
        }),
      );

      expectDiscussionSelector({
        ...defaultStartingDiscussionState,
        isLoading: true,
      });

      dependencies.inclusionConnectedGateway.sendMessageResponse$.next(
        expectedExchange,
      );

      expectDiscussionSelector({
        ...defaultStartingDiscussionState,
        isLoading: false,
      });

      expectToEqual(feedbacksSelectors.feedbacks(store.getState()), {
        "establishment-dashboard-discussion-send-message": {
          on: "create",
          level: "success",
          title: "Message envoyé",
          message: "Le message a bien été envoyé",
        },
      });
    });

    it("send message requested and populate discussion with new exchange", () => {
      expectDiscussionSelector(defaultStartingDiscussionState);
      const exchangePayload: SendMessageRequestedPayload = {
        jwt,
        discussionId: discussion.id,
        message: "My message",
      };
      const expectedExchange: Exchange = {
        message: exchangePayload.message,
        subject: "Réponse de My businessName à votre demande",
        sentAt: new Date().toISOString(),
        sender: "establishment",
        recipient: "potentialBeneficiary",
        attachments: [],
      };

      store.dispatch(
        discussionSlice.actions.fetchDiscussionRequested({
          jwt,
          discussionId: discussion.id,
          feedbackTopic: "dashboard-discussion",
        }),
      );

      feedGatewayWithDiscussionOrError(discussion);

      store.dispatch(
        discussionSlice.actions.sendMessageRequested({
          exchangeData: exchangePayload,
          feedbackTopic: "establishment-dashboard-discussion-send-message",
        }),
      );

      expectDiscussionSelector({
        ...defaultStartingDiscussionState,
        discussion,
        isLoading: true,
      });

      dependencies.inclusionConnectedGateway.sendMessageResponse$.next(
        expectedExchange,
      );

      expectDiscussionSelector({
        ...defaultStartingDiscussionState,
        discussion: {
          ...discussion,
          exchanges: [...discussion.exchanges, expectedExchange],
        },
        isLoading: false,
      });

      expectToEqual(feedbacksSelectors.feedbacks(store.getState()), {
        "dashboard-discussion": {
          on: "fetch",
          level: "success",
          title: "Les discussions ont bien été récupérées",
          message: "Les discussions ont bien été récupérées",
        },
        "establishment-dashboard-discussion-send-message": {
          on: "create",
          level: "success",
          title: "Message envoyé",
          message: "Le message a bien été envoyé",
        },
      });
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
  }: DiscussionState) => {
    expectToEqual(discussionSelectors.isLoading(store.getState()), isLoading);
    expectToEqual(discussionSelectors.discussion(store.getState()), discussion);
  };
});
