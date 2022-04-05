import React from "react";

interface ErrorMessageProps {
  title: string;
  children: React.ReactNode;
}

export const ErrorMessage = ({ title, children }: ErrorMessageProps) => (
  <>
    <div role="alert" className="fr-alert fr-alert--error">
      <p className="fr-alert__title">{title}</p>
      <p>{children}</p>
    </div>
  </>
);
