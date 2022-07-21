import React from "react";
import { NavLink } from "../tabLinks";

type FooterProps = {
  links: NavLink[];
  bottomLinks: NavLink[];
  ministereLogo: React.ReactNode;
  partnersLogos: React.ReactNode[];
};

const TopLink = ({ link }: { link: NavLink }) => (
  <li className="fr-footer__content-item">
    <a
      className="fr-footer__content-link fr-fi-external-link-line fr-link--icon-right"
      target="_blank"
      rel="noopener"
      href={link.link}
    >
      {link.label}
    </a>
  </li>
);

const BottomLink = ({ link }: { link: NavLink }) => (
  <li className="fr-footer__bottom-item">
    <a className="fr-footer__bottom-link" href={link.link}>
      {link.label}
    </a>
  </li>
);

const LogoPartner = ({ children }: { children: React.ReactNode }) => (
  <div className="fr-footer__partners-link">{children}</div>
);

export const Footer = ({
  links,
  bottomLinks,
  ministereLogo,
  partnersLogos,
}: FooterProps) => (
  <footer className="fr-footer" role="contentinfo" id="footer-1060">
    <div className="fr-container">
      <div className="fr-footer__body">
        {ministereLogo}
        {partnersLogos.map((logo) => (
          <LogoPartner>{logo}</LogoPartner>
        ))}

        <div className="fr-footer__content">
          <ul className="fr-footer__content-list">
            {links.map((link, index) => (
              <TopLink key={index} link={link} />
            ))}
          </ul>
        </div>
      </div>

      <div className="fr-footer__bottom">
        <ul className="fr-footer__bottom-list">
          {bottomLinks.map((link, index) => (
            <BottomLink key={index} link={link} />
          ))}
        </ul>
        <div className="fr-footer__bottom-copy">
          <p>
            Sauf mention contraire, tous les contenus de ce site sont sous{" "}
            <a
              href="https://github.com/etalab/licence-ouverte/blob/master/LO.md"
              target="_blank"
            >
              licence etalab-2.0
            </a>
          </p>
        </div>
      </div>
    </div>
  </footer>
);
