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
  const feedbacks = useAppSelector(feedbacksSelectors.feedbacks);
  const feedback = feedbacks[topic];
  const memoizedCallback = useCallback(callback, []);
  useEffect(() => {
    if (!feedback) return;
    if (event === `${feedback.on}.${feedback.level}`) {
      memoizedCallback();
    }
  }, [feedback, memoizedCallback, event]);
};
