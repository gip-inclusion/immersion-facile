import React from "react";

export interface InfoMessageProps {
  title: string;
  children: React.ReactNode;
}

export const InfoMessage = ({ children, title }: InfoMessageProps) => (
  <>
    <div role="alert" className="fr-alert fr-alert--info">
      <p className="fr-alert__title">{title}</p>
      <p>{children}</p>
    </div>
  </>
);
