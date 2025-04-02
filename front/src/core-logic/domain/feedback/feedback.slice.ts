import { type PayloadAction, createSlice } from "@reduxjs/toolkit";
import { keys } from "shared";
import { feedbacks } from "src/core-logic/domain/feedback/feedback.content";

const topics = [
  "api-consumer-global",
  "dashboard-discussion",
  "dashboard-discussion-rejection",
  "broadcast-convention-again",
  "partner-conventions",
  "agency-user",
  "api-consumer-names",
  "dashboard-agency-register-user",
  "auth-global",
  "establishments-batch",
  "user",
  "agency-user-for-dashboard",
  "search-result",
  "form-establishment",
  "siret-input",
  "agency-for-dashboard",
  "assessment",
  "send-signature-link",
  "transfer-convention-to-agency",
  "convention-action-cancel",
  "convention-action-deprecate",
  "convention-action-reject",
  "convention-action-edit",
  "convention-action-accept-by-validator",
  "convention-action-accept-by-counsellor",
  "convention-action-sign",
  "convention-action-renew",
] as const;

export type FeedbackLevel = "info" | "success" | "warning" | "error";

export type Feedback = {
  on: ActionKind;
  level: FeedbackLevel;
  message: string;
  title?: string;
};

export type FeedbackTopic = (typeof topics)[number];

export type Feedbacks = Partial<Record<FeedbackTopic, Feedback>>;

export const initialFeedbacks: Feedbacks = {};

type ActionKind = "create" | "update" | "fetch" | "delete";

export type ActionKindAndLevel = `${ActionKind}.${Feedback["level"]}`;

export type PayloadWithFeedbackTopic = {
  feedbackTopic: FeedbackTopic;
};

export type PayloadActionWithFeedbackTopic<
  // biome-ignore lint/complexity/noBannedTypes: need to use {}
  P extends Record<string, unknown> = {},
> = PayloadAction<P & PayloadWithFeedbackTopic>;

export type PayloadActionWithFeedbackTopicError =
  PayloadActionWithFeedbackTopic<{ errorMessage: string }>;

export const feedbackSlice = createSlice({
  name: "feedbacks",
  initialState: initialFeedbacks,
  reducers: {
    clearFeedbacksTriggered: () => {
      return initialFeedbacks;
    },
  },
  extraReducers: (builder) => {
    keys(feedbacks).map((topic) => {
      const feedbackByTopic = feedbacks[topic];

      return keys(feedbackByTopic).map((kind) => {
        if (!kind) return;
        return keys(kind).map(() => {
          const uniqueActions = Array.from(
            new Set(
              keys(feedbackByTopic).map(
                (level) => feedbackByTopic[level]?.action,
              ),
            ),
          );
          return uniqueActions.map((action) => {
            if (!action) return;
            return builder.addMatcher(
              isActionWithFeedbackTopic(action.type),
              (state, action) => {
                const actionKindAndLevel = keys(
                  feedbacks[action.payload.feedbackTopic],
                ).find((level) => {
                  const feedback =
                    feedbacks[action.payload.feedbackTopic][level];
                  return feedback && feedback.action.type === action.type;
                });
                if (!actionKindAndLevel) return;
                const feedbackForActionTopic =
                  feedbacks[action.payload.feedbackTopic][actionKindAndLevel];
                if (!feedbackForActionTopic) return;
                const { level, actionKind } =
                  getLevelAndActionKindFromActionKindAndLevel(
                    actionKindAndLevel,
                  );

                state[action.payload.feedbackTopic] = {
                  on: actionKind,
                  level,
                  message:
                    action.payload.errorMessage ??
                    feedbackForActionTopic.message,
                  title: feedbackForActionTopic.title,
                };
              },
            );
          });
        });
      });
    });
  },
});

const isActionWithFeedbackTopic =
  <T extends Record<string, any>>(actionType: string) =>
  (action: PayloadAction<T>): action is PayloadActionWithFeedbackTopic<T> =>
    "payload" in action &&
    typeof action.payload === "object" &&
    action.payload &&
    "feedbackTopic" in action.payload &&
    action.type === actionType;

export const getLevelAndActionKindFromActionKindAndLevel = (
  actionKindAndLevel: ActionKindAndLevel,
): {
  level: FeedbackLevel;
  actionKind: ActionKind;
} => {
  const [actionKind, level] = actionKindAndLevel.split(".") as [
    ActionKind,
    FeedbackLevel,
  ];
  return { level, actionKind };
};
