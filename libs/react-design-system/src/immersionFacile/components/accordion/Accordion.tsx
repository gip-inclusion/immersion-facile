import React, { useState } from "react";

export interface AccordionProps {
  title: string;
  children: React.ReactNode;
}

export const Accordion = ({ title, children }: AccordionProps) => {
  const id = title + "-accordion";
  const [expanded, setExpanded] = useState(true);

  const divClass = expanded
    ? "fr-collapse fr-collapse--expanded"
    : "fr-collapse";

  return (
    <section className="fr-accordion" style={{ flex: 1, minWidth: 320 }}>
      <h3 className="fr-accordion__title">
        <button
          className="fr-accordion__btn"
          aria-expanded="false"
          aria-controls={id}
          onClick={() => setExpanded(!expanded)}
        >
          {title}
        </button>
      </h3>
      <div
        className={divClass}
        id={id}
        style={expanded ? { maxHeight: "none" } : {}}
      >
        {children}
      </div>
    </section>
  );
};
