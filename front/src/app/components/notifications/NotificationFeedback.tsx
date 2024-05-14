import Alert from "@codegouvfr/react-dsfr/Alert";
import React from "react";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { notificationsSelectors } from "src/core-logic/domain/notification/notification.selectors";
import {
  NotificationLevel,
  NotificationTopic,
} from "src/core-logic/domain/notification/notification.slice";

type NotificationFeedbackProps = {
  topic: NotificationTopic;
  render?: (props: {
    level: NotificationLevel;
    title?: string;
    message: string;
  }) => JSX.Element;
  children?: React.ReactNode;
};

export const NotificationFeedback = ({
  topic,
  render,
}: NotificationFeedbackProps) => {
  const notifications = useAppSelector(notificationsSelectors.notifications);
  const notification = notifications[topic];
  if (!notification) return null;
  if (render) {
    return render({
      level: notification.level,
      title: notification.title,
      message: notification.message,
    });
  }
  return (
    <Alert
      severity={notification.level}
      title={notification.title}
      description={notification.message}
      small
    />
  );
};
