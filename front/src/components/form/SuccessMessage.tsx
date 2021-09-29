import React from "react";

interface SuccessMessageProps {
  link?: string;
  text?: string;
  title: string;
}

export const SuccessMessage = ({ link, text, title }: SuccessMessageProps) => {
  return (
    <>
      <div role="alert" className="fr-alert fr-alert--success">
        <p className="fr-alert__title">{title}</p>
        <p>
          {text}
          {link && <a href={link}>{link}</a>}
        </p>
      </div>
    </>
  );
};
