import React, { useState } from "react";
import { fr } from "@codegouvfr/react-dsfr";
import { useStyles } from "tss-react/dsfr";

export interface AccordionProps {
  title: string;
  children: React.ReactNode;
}

export const Accordion = ({ title, children }: AccordionProps) => {
  const { cx } = useStyles();
  const id = title + "-accordion";
  const [expanded, setExpanded] = useState(true);

  const divClass = expanded
    ? fr.cx("fr-collapse", "fr-collapse--expanded")
    : fr.cx("fr-collapse");

  return (
    <section
      className={fr.cx("fr-accordion")}
      style={{ flex: 1, minWidth: "100%" }}
    >
      <h3 className={fr.cx("fr-accordion__title")}>
        <button
          className={fr.cx("fr-accordion__btn")}
          aria-expanded={expanded}
          aria-controls={id}
          onClick={() => setExpanded(!expanded)}
        >
          {title}
        </button>
      </h3>
      <div
        className={cx(divClass)}
        id={id}
        style={expanded ? { maxHeight: "none" } : {}}
      >
        {children}
      </div>
    </section>
  );
};
