import React, { Component, ReactChildren, useState } from "react";

interface AccordeonProps {
  title: string;
  children: React.ReactNode;
}

export const Accordeon = ({ title, children }: AccordeonProps) => {
  const id = title + "-accordion";
  const [expanded, setExpanded] = useState(true);

  const divClass = expanded
    ? "fr-collapse fr-collapse--expanded"
    : "fr-collapse";

  return (
    <>
      <section className="fr-accordion">
        {
          <>
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
          </>
        }
      </section>
    </>
  );
};
