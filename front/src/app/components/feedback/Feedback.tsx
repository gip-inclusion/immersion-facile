import Alert from "@codegouvfr/react-dsfr/Alert";
import type { ReactNode } from "react";
import { errors } from "shared";
import { useFeedbackTopics } from "src/app/hooks/feedback.hooks";
import type { FeedbackTopic } from "src/core-logic/domain/feedback/feedback.content";
import type { FeedbackLevel } from "src/core-logic/domain/feedback/feedback.slice";

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

const formatFeedbackMessage = (message: string) => {
  const parsedMessage = JSON.parse(message);
  if (parsedMessage && "issues" in parsedMessage) {
    return errors.generic.clearZodIssues({
      schemaName: parsedMessage.schemaName,
      issues: parsedMessage.issues,
    }).message;
  }
  return message;
};

export const Feedback = ({
  topics = [],
  render,
  closable,
  className,
}: FeedbackProps) => {
  const relevantFeedbacks = useFeedbackTopics(topics);

  if (relevantFeedbacks.length === 0) return null;

  if (render) {
    return (
      <>
        {relevantFeedbacks.map((feedback) => (
          <div key={feedback.message}>
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
      {relevantFeedbacks.map((feedback) =>
        closable === true ? (
          <Alert
            key={feedback.message}
            severity={feedback.level}
            title={feedback.title}
            description={formatFeedbackMessage(feedback.message)}
            small
            closable={closable}
            className={className}
          />
        ) : (
          <Alert
            key={feedback.message}
            severity={feedback.level}
            title={feedback.title}
            description={formatFeedbackMessage(feedback.message)}
            small
            className={className}
          />
        ),
      )}
    </>
  );
};
