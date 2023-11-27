import React from "react";
import { fr } from "@codegouvfr/react-dsfr";
import { useStyles } from "tss-react/dsfr";
import plateformeInclusionLogoUrl from "./assets/img/logo-plateforme-inclusion.svg";
import Styles from "./Footer.styles";

export type NavLink = {
  onClick?: (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => void;
  label: string;
  href?: string;
  active?: boolean;
  target?: string;
  children?: NavLink[];
  index?: number;
  id: string;
};

export type FooterProps = {
  links?: NavLink[];
  bottomLinks?: NavLink[];
  topFooter: React.ReactNode;
  partnersLogos?: React.ReactNode;
};

const TopLink = ({ link }: { link: NavLink }) => {
  const { cx } = useStyles();
  return (
    <li className={cx("fr-footer__content-item")}>
      <a
        className={fr.cx(
          "fr-footer__content-link",
          "fr-icon-external-link-line",
          "fr-link--icon-right",
        )}
        {...link}
      >
        {link.label}
      </a>
    </li>
  );
};

const BottomLink = ({ link }: { link: NavLink }) => (
  <li className={fr.cx("fr-footer__bottom-item")}>
    <a className={fr.cx("fr-footer__bottom-link")} {...link}>
      {link.label}
    </a>
  </li>
);

export const Footer = ({
  links,
  topFooter,
  bottomLinks,
  partnersLogos,
}: FooterProps) => {
  const { cx } = useStyles();
  return (
    <footer className={cx(fr.cx("fr-footer"), Styles.root)} id="main-footer">
      {topFooter}
      <div className={fr.cx("fr-container")}>
        <div className={cx(fr.cx("fr-footer__content-list"), Styles.content)}>
          {links && links.length > 0 && (
            <ul className={fr.cx("fr-footer__content")}>
              {links.map((link, index) => (
                // eslint-disable-next-line react/no-array-index-key
                <TopLink key={index} link={link} />
              ))}
            </ul>
          )}
        </div>
        <div className={fr.cx("fr-footer__partners")}>
          <div className={fr.cx("fr-footer__partners-logos")}>
            <div
              className={cx(
                fr.cx("fr-footer__partners-main"),
                Styles.partnersMain,
              )}
            >
              <span>Ce service fait partie de la </span>
              <div className={fr.cx("fr-footer__brand")}>
                <img
                  src={plateformeInclusionLogoUrl}
                  alt="Plateforme de l'Inclusion"
                  className={fr.cx("fr-footer__logo")}
                  style={{ height: "5.625rem" }}
                />
                <p
                  className={cx(fr.cx("fr-ml-2w", "fr-mb-0"), Styles.brandText)}
                >
                  Découvrez les outils qui portent l'inclusion au cœur de leur
                  service. À chaque service, son objectif.
                  <a
                    className={fr.cx(
                      "fr-footer__content-link",
                      "fr-icon-external-link-line",
                      "fr-link--icon-right",
                    )}
                    href={""}
                  >
                    Découvrez nos services
                  </a>
                </p>
              </div>
            </div>
            <div
              className={cx(
                fr.cx("fr-footer__partners-sub"),
                Styles.partnersSub,
              )}
            >
              {partnersLogos}
            </div>
          </div>
        </div>
        <div className={fr.cx("fr-footer__bottom")}>
          {bottomLinks && bottomLinks.length > 0 && (
            <ul className={fr.cx("fr-footer__bottom-list")}>
              {bottomLinks.map((link, index) => (
                // eslint-disable-next-line react/no-array-index-key
                <BottomLink key={index} link={link} />
              ))}
            </ul>
          )}

          <div className={fr.cx("fr-footer__bottom-copy")}>
            <p>
              Sauf mention contraire, tous les contenus de ce site sont sous{" "}
              <a
                href="https://github.com/etalab/licence-ouverte/blob/master/LO.md"
                target="_blank"
                rel="noreferrer"
              >
                licence etalab-2.0
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
