import React from "react";
import { fr } from "@codegouvfr/react-dsfr";

export type SkipLink = {
  label: string;
  anchor: string;
};

type SkipLinksProps = {
  links: SkipLink[];
};

export const SkipLinks = ({ links }: SkipLinksProps) => (
  <div className={fr.cx("fr-skiplinks")}>
    <nav
      className={fr.cx("fr-container")}
      role="navigation"
      aria-label="Accès rapide"
    >
      <ul className={fr.cx("fr-skiplinks__list")}>
        {links &&
          links.map((link) => (
            <li key={link.anchor}>
              <a className={fr.cx("fr-link")} href={`#${link.anchor}`}>
                {link.label}
              </a>
            </li>
          ))}
      </ul>
    </nav>
  </div>
);
