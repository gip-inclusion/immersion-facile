import Alert from "@codegouvfr/react-dsfr/Alert";
import type { ReactNode } from "react";

import { useAppSelector } from "src/app/hooks/reduxHooks";
import { feedbacksSelectors } from "src/core-logic/domain/feedback/feedback.selectors";
import type {
  FeedbackLevel,
  FeedbackTopic,
  Feedback as FeedbackType,
} from "src/core-logic/domain/feedback/feedback.slice";

type FeedbackProps = {
  topics: FeedbackTopic[];
  render?: (props: {
    level: FeedbackLevel;
    title?: string;
    message: string;
  }) => JSX.Element;
  closable?: boolean;
  children?: ReactNode;
  className?: string;
};

type ValidFeedback = {
  topic: FeedbackTopic;
  feedback: FeedbackType;
};

export const Feedback = ({
  topics = [],
  render,
  closable,
  className,
}: FeedbackProps) => {
  const feedbacks = useAppSelector(feedbacksSelectors.feedbacks);

  const relevantFeedbacks: ValidFeedback[] = topics
    .map((t) => ({ topic: t, feedback: feedbacks[t] }))
    .filter((item): item is ValidFeedback => !!item.feedback);

  if (relevantFeedbacks.length === 0) return null;

  if (render) {
    return (
      <>
        {relevantFeedbacks.map(({ topic, feedback }) => (
          <div key={topic}>
            {render({
              level: feedback.level,
              title: feedback.title,
              message: feedback.message,
            })}
          </div>
        ))}
      </>
    );
  }

  return (
    <>
      {relevantFeedbacks.map(({ topic, feedback }) =>
        closable === true ? (
          <Alert
            key={topic}
            severity={feedback.level}
            title={feedback.title}
            description={feedback.message}
            small
            closable={closable}
            className={className}
          />
        ) : (
          <Alert
            key={topic}
            severity={feedback.level}
            title={feedback.title}
            description={feedback.message}
            small
            className={className}
          />
        ),
      )}
    </>
  );
};
