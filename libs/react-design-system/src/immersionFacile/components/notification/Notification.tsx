import React, { ReactNode } from "react";
interface InfoMessageProps {
  title: string;
  children: React.ReactNode;
}
interface ErrorMessageProps {
  title: string;
  children: React.ReactNode;
}
interface SuccessMessageProps {
  title: string;
  children: React.ReactNode;
}
const ErrorMessage = ({ title, children }: ErrorMessageProps) => (
  <>
    <div role="alert" className="fr-alert fr-alert--error">
      <p className="fr-alert__title">{title}</p>
      <p>{children}</p>
    </div>
  </>
);
const InfoMessage = ({ children, title }: InfoMessageProps) => (
  <>
    <div role="alert" className="fr-alert fr-alert--info">
      <p className="fr-alert__title">{title}</p>
      <p>{children}</p>
    </div>
  </>
);
const SuccessMessage = ({ title, children }: SuccessMessageProps) => (
  <div role="alert" className="fr-alert fr-alert--success">
    <p className="fr-alert__title">{title}</p>
    {children}
  </div>
);

type NotificationType = "success" | "info" | "error";

export type NotificationProperties = {
  title: string;
  type: NotificationType;
  children: ReactNode;
};
export const Notification = ({
  title,
  type,
  children,
}: NotificationProperties) => (
  <div role="alert" className={`fr-alert fr-alert--${type}`}>
    <p className="fr-alert__title">{title}</p>
    {children}
  </div>
);
