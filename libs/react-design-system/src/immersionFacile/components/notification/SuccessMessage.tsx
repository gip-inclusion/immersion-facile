import React from "react";

export interface SuccessMessageProps {
  title: string;
  children: React.ReactNode;
}

export const SuccessMessage = ({ title, children }: SuccessMessageProps) => (
  <div role="alert" className="fr-alert fr-alert--success">
    <p className="fr-alert__title">{title}</p>
    {children}
  </div>
);
