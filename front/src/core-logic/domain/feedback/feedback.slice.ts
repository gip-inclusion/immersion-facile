import {
  ActionCreatorWithPayload,
  PayloadAction,
  createSlice,
} from "@reduxjs/toolkit";
import { keys } from "shared";
import { apiConsumerSlice } from "src/core-logic/domain/apiConsumer/apiConsumer.slice";
import { conventionSlice } from "src/core-logic/domain/convention/convention.slice";
import { discussionSlice } from "src/core-logic/domain/discussion/discussion.slice";
import { icUsersAdminSlice } from "../admin/icUsersAdmin/icUsersAdmin.slice";
import { partnersErroredConventionSlice } from "../partnersErroredConvention/partnersErroredConvention.slice";

const topics = [
  "api-consumer-global",
  "dashboard-discussion",
  "dashboard-discussion-rejection",
  "broadcast-convention-again",
  "partner-conventions",
  "agency-user",
  "api-consumer-names",
] as const;

export type FeedbackLevel = "info" | "success" | "warning" | "error";

type Feedback = {
  on: ActionKind;
  level: FeedbackLevel;
  message: string;
  title?: string;
};

export type FeedbackTopic = (typeof topics)[number];

type Feedbacks = Partial<Record<FeedbackTopic, Feedback>>;

const initialFeedbacks: Feedbacks = {};

type FeedbackWithActionName = {
  action: ActionCreatorWithPayload<any, string>;
  title: Feedback["title"];
  message: Feedback["message"];
};

type ActionKind = "create" | "update" | "fetch" | "delete";

export type ActionKindAndLevel = `${ActionKind}.${Feedback["level"]}`;

type PayloadWithFeedbackTopic = {
  feedbackTopic: FeedbackTopic;
};

export type PayloadActionWithFeedbackTopic<
  // biome-ignore lint/complexity/noBannedTypes: need to use {}
  P extends Record<string, unknown> = {},
> = PayloadAction<P & PayloadWithFeedbackTopic>;

export const feedbackMapping: Record<
  FeedbackTopic,
  Partial<Partial<Record<ActionKindAndLevel, FeedbackWithActionName>>>
> = {
  "api-consumer-global": {
    "create.success": {
      action: apiConsumerSlice.actions.saveApiConsumerSucceeded,
      title: "Le consommateur d'API a bien été créé",
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
      title: "Le consommateur d'API a bien été mis à jour",
      message:
        "Le consommateur d'API a bien été mis à jour, il peut continuer à utiliser l'api",
    },
  },
  "broadcast-convention-again": {
    "create.success": {
      action: conventionSlice.actions.broadcastConventionToPartnerSucceeded,
      title: "La convention a bien été rediffusée",
      message:
        "La convention a bien été rediffusée au partenaire. Vous pouvez vous rapprocher du partenaire pour le vérifier.",
    },
    "create.error": {
      action: conventionSlice.actions.broadcastConventionToPartnerFailed,
      title: "Problème rencontré lors de la rediffusion au partenaire",
      message:
        "Une erreur est survenue. Veuillez consulter le tableau de bord.",
    },
  },
  "dashboard-discussion-rejection": {
    "update.success": {
      action: discussionSlice.actions.updateDiscussionStatusSucceeded,
      title: "La candidature a bien été rejetée",
      message:
        "La candidature a bien été rejetée, un email a été envoyé au candidat",
    },
    "update.error": {
      action: discussionSlice.actions.updateDiscussionStatusFailed,
      title: "Problème lors du rejet de la candidature",
      message: "Une erreur est survenue lors du rejet de la candidature",
    },
  },
  "dashboard-discussion": {
    "fetch.success": {
      action: discussionSlice.actions.fetchDiscussionSucceeded,
      title: "Les discussions ont bien été récupérées",
      message: "Les discussions ont bien été récupérées",
    },
    "fetch.error": {
      action: discussionSlice.actions.fetchDiscussionFailed,
      title: "Problème lors de la récupération des discussions",
      message:
        "Une erreur est survenue lors de la récupération des discussions",
    },
  },
  "partner-conventions": {
    "update.success": {
      action: partnersErroredConventionSlice.actions.markAsHandledSucceeded,
      title: "La convention a bien été marquée comme traitée",
      message: "La convention a bien été marquée comme traitée.",
    },
    "update.error": {
      action: partnersErroredConventionSlice.actions.markAsHandledFailed,
      title: "Problème rencontré",
      message:
        "Problème rencontré lors du marquage de la convention comme traitée.",
    },
  },
  "api-consumer-names": {
    "create.error": {
      action: apiConsumerSlice.actions.fetchApiConsumerNamesFailed,
      title: "Problème rencontré",
      message:
        "Une erreur est survenue lors de la récupération de la liste des partenaires à qui rediffuser la convention",
    },
  },
  "agency-user": {
    "update.success": {
      action: icUsersAdminSlice.actions.updateUserOnAgencySucceeded,
      title: "L'utilisateur a été mis à jour",
      message: "Les données de l'utilisateur (rôles) ont été mises à jour.",
    },
    "update.error": {
      action: icUsersAdminSlice.actions.updateUserOnAgencyFailed,
      title: "Problème lors de la mise à jour de l'utilisateur",
      message:
        "Une erreur est survenue lors de la mise à jour de l'utilisateur",
    },
  },
};

export const feedbackSlice = createSlice({
  name: "feedbacks",
  initialState: initialFeedbacks,
  reducers: {
    clearFeedbacksTriggered: () => {
      return initialFeedbacks;
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
