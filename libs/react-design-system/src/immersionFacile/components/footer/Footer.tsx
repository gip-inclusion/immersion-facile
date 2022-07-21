import React from "react";
import { NavLinksType } from "../header";

type FooterProps = {
  links: NavLinksType;
};

const TopLink = ({ link }: { link: NavLinksType }) => (
  <li className="fr-footer__content-item">
    <a
      className="fr-footer__content-link"
      target="_blank"
      href="https://legifrance.gouv.fr"
    >
      legifrance.gouv.fr
    </a>
  </li>
);

export const Footer = ({ links }: FooterProps) => (
  <footer className="fr-footer" role="contentinfo" id="footer-1060">
    <div className="fr-container">
      <div className="fr-footer__body">
        <div className="fr-footer__brand fr-enlarge-link">
          <a href="/" title="Retour à l’accueil">
            <p className="fr-logo">
              Intitulé
              <br />
              officiel
            </p>
          </a>
        </div>
        <div className="fr-footer__content">
          <p className="fr-footer__content-desc">Lorem [...] elit ut.</p>
          <ul className="fr-footer__content-list">
            {links.map((link) => (
              <TopLink key={link.link} link={link} />
            ))}
            <li className="fr-footer__content-item">
              <a
                className="fr-footer__content-link"
                target="_blank"
                href="https://legifrance.gouv.fr"
              >
                legifrance.gouv.fr
              </a>
            </li>
            <li className="fr-footer__content-item">
              <a
                className="fr-footer__content-link"
                target="_blank"
                href="https://gouvernement.fr"
              >
                gouvernement.fr
              </a>
            </li>
            <li className="fr-footer__content-item">
              <a
                className="fr-footer__content-link"
                target="_blank"
                href="https://service-public.fr"
              >
                service-public.fr
              </a>
            </li>
            <li className="fr-footer__content-item">
              <a
                className="fr-footer__content-link"
                target="_blank"
                href="https://data.gouv.fr"
              >
                data.gouv.fr
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="fr-footer__partners">
        <h4 className="fr-footer__partners-title">Nos partenaires</h4>
        <div className="fr-footer__partners-logos">
          <div className="fr-footer__partners-main">
            <a className="footer__partners-link" href="#"></a>
          </div>
          <div className="fr-footer__partners-sub">
            <ul>
              <li>
                <a className="fr-footer__partners-link" href="#"></a>
              </li>
              <li>
                <a className="fr-footer__partners-link" href="#"></a>
              </li>
              <li>
                <a className="fr-footer__partners-link" href="#"></a>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="fr-footer__bottom">
        <ul className="fr-footer__bottom-list">
          <li className="fr-footer__bottom-item">
            <a className="fr-footer__bottom-link" href="#">
              Plan du site
            </a>
          </li>
          <li className="fr-footer__bottom-item">
            <a className="fr-footer__bottom-link" href="#">
              Accessibilité : non/partiellement/totalement conforme
            </a>
          </li>
          <li className="fr-footer__bottom-item">
            <a className="fr-footer__bottom-link" href="#">
              Mentions légales
            </a>
          </li>
          <li className="fr-footer__bottom-item">
            <a className="fr-footer__bottom-link" href="#">
              Données personnelles
            </a>
          </li>
          <li className="fr-footer__bottom-item">
            <a className="fr-footer__bottom-link" href="#">
              Gestion des cookies
            </a>
          </li>
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
