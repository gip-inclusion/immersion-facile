import React from "react";

interface InfoMessageProps {
  text: string;
  title: string;
}

export const InfoMessage = ({ text, title }: InfoMessageProps) => (
  <>
    <div role="alert" className="fr-alert fr-alert--info">
      <p className="fr-alert__title">{title}</p>
      <p>{text}</p>
    </div>
  </>
);
