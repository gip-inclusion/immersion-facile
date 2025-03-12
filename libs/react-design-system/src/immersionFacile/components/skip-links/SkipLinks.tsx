import { fr } from "@codegouvfr/react-dsfr";

export type SkipLink = {
  label: string;
  anchor: string;
};

export type SkipLinksProps = {
  links: SkipLink[];
};

export const SkipLinks = ({ links }: SkipLinksProps) => (
  <div className={fr.cx("fr-skiplinks")}>
    <nav className={fr.cx("fr-container")} aria-label="Accès rapide">
      <ul className={fr.cx("fr-skiplinks__list")}>
        {links?.map((link) => (
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
