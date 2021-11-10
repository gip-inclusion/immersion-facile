import React from "react";
import poleEmploiLogo from "src/assets/pole-emploi-logo.png";

export const MinistereLogo = () => (
  <div className="fr-header__brand-top">
    <div className="fr-header__logo">
      <p className="fr-logo">
        Ministère
        <br />
        du travail,
        <br />
        de l'emploi
        <br />
        et de l'insertion
      </p>
    </div>
  </div>
);

export const Footer = () => (
  <div className="mx-3 md:mx-20 mt-10">
    <footer className="fr-footer" role="contentinfo" id="footer">
      <div className="fr-container">
        <div className="fr-footer__body flex justify-between">
          <MinistereLogo />
          <img src={poleEmploiLogo} alt="logo-pole-emploi" height={20} />
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
                Accessibilité: non/partiellement/totalement conforme
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
              Sauf mention contraire, tous les textes de ce site sont sous{" "}
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
  </div>
);
