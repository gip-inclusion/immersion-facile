import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { Feedback } from "src/app/components/feedback/Feedback";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import type { FeedbackTopic } from "src/core-logic/domain/feedback/feedback.content";
import { feedbacksSelectors } from "src/core-logic/domain/feedback/feedback.selectors";
import {
  type FeedbackLevel,
  feedbackSlice,
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
  const dispatch = useDispatch();

  useEffect(() => {
    return () => {
      if (feedback) {
        dispatch(feedbackSlice.actions.clearFeedbacksTriggered());
      }
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
    <Feedback topics={[topic]} />
  );
};
