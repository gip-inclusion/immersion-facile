import { useCallback, useEffect } from "react";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { feedbacksSelectors } from "src/core-logic/domain/feedback/feedback.selectors";
import {
  ActionKindAndLevel,
  FeedbackTopic,
} from "src/core-logic/domain/feedback/feedback.slice";

export const useFeebackEventCallback = (
  topic: FeedbackTopic,
  event: ActionKindAndLevel,
  callback: () => void,
) => {
  const feedback = useFeedbackTopic(topic);
  const memoizedCallback = useCallback(callback, []);
  useEffect(() => {
    if (!feedback) return;
    if (event === `${feedback.on}.${feedback.level}`) {
      memoizedCallback();
    }
  }, [feedback, memoizedCallback, event]);
};

export const useFeedbackTopic = (topic: FeedbackTopic) => {
  const feedbacks = useAppSelector(feedbacksSelectors.feedbacks);
  return feedbacks[topic];
};
