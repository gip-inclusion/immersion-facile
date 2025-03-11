import Alert from "@codegouvfr/react-dsfr/Alert";
import type React from "react";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { feedbacksSelectors } from "src/core-logic/domain/feedback/feedback.selectors";
import type {
  FeedbackLevel,
  FeedbackTopic,
} from "src/core-logic/domain/feedback/feedback.slice";

type FeedbackProps = {
  topic: FeedbackTopic;
  render?: (props: {
    level: FeedbackLevel;
    title?: string;
    message: string;
  }) => JSX.Element;
  closable?: boolean;
  children?: React.ReactNode;
  className?: string;
};

export const Feedback = ({
  topic,
  render,
  closable,
  className,
}: FeedbackProps) => {
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

  return closable === true ? (
    <Alert
      severity={feedback.level}
      title={feedback.title}
      description={feedback.message}
      small
      closable={closable}
      className={className}
    />
  ) : (
    <Alert
      severity={feedback.level}
      title={feedback.title}
      description={feedback.message}
      small
      className={className}
    />
  );
};
