import {
  ActionCreatorWithPayload,
  PayloadAction,
  createSlice,
} from "@reduxjs/toolkit";
import { keys } from "shared";
import { apiConsumerSlice } from "src/core-logic/domain/apiConsumer/apiConsumer.slice";

const topics = ["api-consumer-global"] as const;

export type NotificationLevel = "info" | "success" | "warning" | "error";

type Notification = {
  level: NotificationLevel;
  message: string;
  title?: string;
};

export type NotificationTopic = (typeof topics)[number];

type Notifications = Partial<Record<NotificationTopic, Notification>>;

const initialNotifications: Notifications = {};

type FeedbackWithActionName = {
  action: ActionCreatorWithPayload<any, string>;
  title: Notification["title"];
  message: Notification["message"];
};

type ActionKind = "create" | "update" | "fetch" | "delete";

type ActionKindAndLevel = `${ActionKind}.${Notification["level"]}`;

type PayloadWithFeedbackTopic = { feedbackTopic: NotificationTopic };

// biome-ignore lint/complexity/noBannedTypes: need to use {}
export type PayloadActionWithFeedbackTopic<P = {}> = PayloadAction<
  P & PayloadWithFeedbackTopic
>;

export const feedbackMapping: Record<
  NotificationTopic,
  Partial<Partial<Record<ActionKindAndLevel, FeedbackWithActionName>>>
> = {
  "api-consumer-global": {
    "create.success": {
      action: apiConsumerSlice.actions.saveApiConsumerSucceeded,
      title: "Le consommateur d'API a bien été créé.",
      message:
        "Le consommateur d'API a bien été créé, il peut commencer à utiliser l'api",
    },
    "create.error": {
      action: apiConsumerSlice.actions.saveApiConsumerFailed,
      title: "Problème lors de la création du consommateur d'API",
      message:
        "Une erreur est survenue lors de la création du consommateur d'API",
    },
    "update.success": {
      action: apiConsumerSlice.actions.updateApiConsumerSucceeded,
      title: "Le consommateur d'API a bien été mis à jour.",
      message:
        "Le consommateur d'API a bien été mis à jour, il peut continuer à utiliser l'api",
    },
  },
};

export const notificationSlice = createSlice({
  name: "notifications",
  initialState: initialNotifications,
  reducers: {
    clearNotificationsTriggered: () => {
      return initialNotifications;
    },
  },
  extraReducers: (builder) => {
    keys(feedbackMapping).map((topic) => {
      const feedbackByTopic = feedbackMapping[topic];

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
                  feedbackMapping[action.payload.feedbackTopic],
                ).find((level) => {
                  const feedback =
                    feedbackMapping[action.payload.feedbackTopic][level];
                  return feedback && feedback.action.type === action.type;
                });
                if (!actionKindAndLevel) return;
                const feedbackForActionTopic =
                  feedbackMapping[action.payload.feedbackTopic][
                    actionKindAndLevel
                  ];
                if (!feedbackForActionTopic) return;
                state[action.payload.feedbackTopic] = {
                  level: getLevelFromActionKindAndLevel(actionKindAndLevel),
                  message: feedbackForActionTopic.message,
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

const getLevelFromActionKindAndLevel = (
  actionKindAndLevel: ActionKindAndLevel,
) => {
  const level = actionKindAndLevel.split(".")[1];
  return level as NotificationLevel;
};
