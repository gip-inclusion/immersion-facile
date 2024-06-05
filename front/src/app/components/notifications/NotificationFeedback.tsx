import Alert from "@codegouvfr/react-dsfr/Alert";
import React from "react";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { feedbacksSelectors } from "src/core-logic/domain/feedback/feedback.selectors";
import {
  FeedbackLevel,
  FeedbackTopic,
} from "src/core-logic/domain/feedback/feedback.slice";

type NotificationFeedbackProps = {
  topic: FeedbackTopic;
  render?: (props: {
    level: FeedbackLevel;
    title?: string;
    message: string;
  }) => JSX.Element;
  children?: React.ReactNode;
};

export const NotificationFeedback = ({
  topic,
  render,
}: NotificationFeedbackProps) => {
  const feedbacks = useAppSelector(feedbacksSelectors.feedbacks);
  const feedback = feedbacks[topic];
  if (!feedback) return null;
  if (render) {
    return render({
      level: feedback.level,
      title: feedback.title,
      message: feedback.message,
    });
  }
  return (
    <Alert
      severity={feedback.level}
      title={feedback.title}
      description={feedback.message}
      small
    />
  );
};
