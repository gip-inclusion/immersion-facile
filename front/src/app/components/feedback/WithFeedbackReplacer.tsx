import React from "react";
import { Feedback } from "src/app/components/feedback/Feedback";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { feedbacksSelectors } from "src/core-logic/domain/feedback/feedback.selectors";
import {
  FeedbackLevel,
  FeedbackTopic,
} from "src/core-logic/domain/feedback/feedback.slice";

type WithFeedbackReplacerProps = {
  topic: FeedbackTopic;
  renderFeedback?: (props: {
    level: FeedbackLevel;
    title?: string;
    message: string;
  }) => JSX.Element;
  children?: JSX.Element;
};

export const WithFeedbackReplacer = ({
  topic,
  children,
  renderFeedback,
}: WithFeedbackReplacerProps) => {
  const feedbacks = useAppSelector(feedbacksSelectors.feedbacks);
  const feedback = feedbacks[topic];
  if (!feedback && children) return children;
  return renderFeedback && feedback ? (
    renderFeedback({
      level: feedback.level,
      title: feedback.title,
      message: feedback.message,
    })
  ) : (
    <Feedback topic={topic} />
  );
};
