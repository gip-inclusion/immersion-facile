import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { NotificationFeedback } from "src/app/components/notifications/NotificationFeedback";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { feedbacksSelectors } from "src/core-logic/domain/feedback/feedback.selectors";
import {
  FeedbackLevel,
  FeedbackTopic,
  feedbackSlice,
} from "src/core-logic/domain/feedback/feedback.slice";

type NotificationFeedbackProps = {
  topic: FeedbackTopic;
  renderFeedback?: (props: {
    level: FeedbackLevel;
    title?: string;
    message: string;
  }) => JSX.Element;
  children?: JSX.Element;
};

export const WithNotificationFeedbackReplacer = ({
  topic,
  children,
  renderFeedback,
}: NotificationFeedbackProps) => {
  const feedbacks = useAppSelector(feedbacksSelectors.feedbacks);
  const feedback = feedbacks[topic];
  const dispatch = useDispatch();
  useEffect(() => {
    return () => {
      dispatch(feedbackSlice.actions.clearFeedbacksTriggered());
    };
  }, [dispatch]);
  if (!feedback && children) return children;
  return renderFeedback && feedback ? (
    renderFeedback({
      level: feedback.level,
      title: feedback.title,
      message: feedback.message,
    })
  ) : (
    <NotificationFeedback topic={topic} />
  );
};
