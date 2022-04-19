import lesEntrepriseSengagent from "/les-entreprises-s-engagent.svg";
import poleEmploiLogo from "/pole-emploi-logo.svg";
import React from "react";

export const MinistereLogo = () => (
  <div className="fr-header__brand-top w-auto">
    <div className="fr-header__logo w-auto">
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

export const ImmersionFooter = () => (
  <div className="mx-3 md:mx-20 mt-10">
    <footer className="fr-footer" role="contentinfo" id="footer">
      <div className="fr-container">
        <div className="flex justify-between fr-footer__body">
          <MinistereLogo />
          <div className="flex">
            <img src={poleEmploiLogo} alt="logo-pole-emploi" />
            <img src={lesEntrepriseSengagent} alt="logo-pole-emploi" />
          </div>
        </div>
        <div className="fr-footer__bottom">
          <ul className="fr-footer__bottom-list">
            <li className="fr-footer__bottom-item">
              <a
                className="fr-footer__bottom-link"
                href="https://immersion-facile-1.gitbook.io/mentions-legales/"
                target="_blank"
              >
                Mentions légales
              </a>
            </li>
            <li className="fr-footer__bottom-item">
              <a
                className="fr-footer__bottom-link"
                href="https://immersion-facile-1.gitbook.io/mentions-legales/politique-de-confidentialite"
                target="_blank"
              >
                Politique de confidentialité
              </a>
            </li>
            <li className="fr-footer__bottom-item">
              <a
                className="fr-footer__bottom-link"
                href="https://immersion-facile-1.gitbook.io/mentions-legales/conditions-generales-dutilisation"
                target="_blank"
              >
                Conditions générales d'utilisation
              </a>
            </li>
            <li className="fr-footer__bottom-item">
              <a
                className="fr-footer__bottom-link"
                href="mailto:contact@immersion-facile.beta.gouv.fr"
              >
                Nous contacter
              </a>
            </li>
            <li className="fr-footer__bottom-item">
              <a
                className="fr-footer__bottom-link"
                href="https://immersion-facile-1.gitbook.io/la-page-stats-de-immersion-facilitee/mXyCG0khRml5mCWUU0Pe/la-mesure-de-limpact-dimmersion-facilitee"
                target="_blank"
              >
                Statistiques
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
