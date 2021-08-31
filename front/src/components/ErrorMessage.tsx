import React from "react";

interface ErrorMessageProps {
  message: string;
  title: string;
}

export const ErrorMessage = ({ message, title }: ErrorMessageProps) => (
  <>
    <div role="alert" className="fr-alert fr-alert--error">
      <p className="fr-alert__title">{title}</p>
      <p>{message}</p>
    </div>
  </>
);
