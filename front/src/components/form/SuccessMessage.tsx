import React from "react";
import { asParagraph } from "../renderers/asParagraph";

interface SuccessMessageProps {
  title: string;
  children: React.ReactNode | string;
}

export const SuccessMessage = ({ title, children }: SuccessMessageProps) => {
  return (
    <div role="alert" className="fr-alert fr-alert--success">
      <p className="fr-alert__title">{title}</p>
      {messageAsElement(children)}
    </div>
  );
};

const messageAsElement = (content: React.ReactNode | string) =>
  typeof content === "string" ? asParagraph(content) : content;
