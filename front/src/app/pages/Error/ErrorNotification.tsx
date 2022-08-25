import React from "react";
import { Notification } from "react-design-system";

type ErrorNotificationProperties = {
  title: string;
  children?: React.ReactNode;
};

export const ErrorNotification = ({
  title,
  children,
}: ErrorNotificationProperties): JSX.Element => (
  <Notification title={title} type="error">
    {children}
  </Notification>
);
