import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { NotificationFeedback } from "src/app/components/notifications/NotificationFeedback";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { notificationsSelectors } from "src/core-logic/domain/notification/notification.selectors";
import {
  NotificationLevel,
  NotificationTopic,
  notificationSlice,
} from "src/core-logic/domain/notification/notification.slice";

type NotificationFeedbackProps = {
  topic: NotificationTopic;
  renderFeedback?: (props: {
    level: NotificationLevel;
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
  const notifications = useAppSelector(notificationsSelectors.notifications);
  const notification = notifications[topic];
  const dispatch = useDispatch();
  useEffect(() => {
    return () => {
      dispatch(notificationSlice.actions.clearNotificationsTriggered());
    };
  }, [dispatch]);
  if (!notification && children) return children;
  return renderFeedback && notification ? (
    renderFeedback({
      level: notification.level,
      title: notification.title,
      message: notification.message,
    })
  ) : (
    <NotificationFeedback topic={topic} />
  );
};
