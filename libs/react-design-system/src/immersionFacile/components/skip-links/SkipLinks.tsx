import React from "react";

export type SkipLink = {
  label: string;
  anchor: string;
};

type SkipLinksProps = {
  links: SkipLink[];
};

export const SkipLinks = ({ links }: SkipLinksProps) => (
  <div className="fr-skiplinks">
    <nav className="fr-container" role="navigation" aria-label="Accès rapide">
      <ul className="fr-skiplinks__list">
        {links &&
          links.map((link) => (
            <li key={link.anchor}>
              <a className="fr-link" href={`#${link.anchor}`}>
                {link.label}
              </a>
            </li>
          ))}
      </ul>
    </nav>
  </div>
);
