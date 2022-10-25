import lesEntrepriseSengagent from "/img/les-entreprises-s-engagent.svg";
import poleEmploiLogo from "/img/pole-emploi-logo.svg";
import React from "react";
import { Footer, NavLink } from "react-design-system";
import {
  OverFooter,
  OverFooterCols,
} from "react-design-system/immersionFacile";

export const MinistereLogo = () => (
  <div className="fr-footer__brand fr-enlarge-link">
    <p className="fr-logo">
      Ministère
      <br />
      du travail,
      <br />
      du plein emploi
      <br />
      et de l'insertion
    </p>
  </div>
);

const PoleEmploiLogo = () => (
  <img src={poleEmploiLogo} alt="Pole Emploi" style={{ margin: "0 1.5rem" }} />
);
const EntreprisesLogo = () => (
  <img src={lesEntrepriseSengagent} alt="Les entreprises s'engagent" />
);

const overFooterCols: OverFooterCols = [
  {
    title: "Contactez-nous",
    subtitle:
      "L'équipe Immersion Facilitée vous accompagne pour toute demande spécifique.",
    iconTitle: "fr-icon-account-fill",
    link: {
      label: "Contactez l'équipe",
      url: "mailto:contact@immersion-facile.beta.gouv.fr",
    },
  },
  {
    title: "Rejoignez la communauté",
    subtitle:
      "Rejoignez la communauté d'Immersion Facilitée et suivez nos actualités.",
    iconTitle: "fr-icon-links-fill",
    link: {
      label: "Rejoignez-nous sur Linkedin",
      url: "https://www.linkedin.com/company/l-immersion-facilitee/",
    },
  },
  {
    title: "Le centre d'aide",
    subtitle:
      "Consultez notre FAQ et trouver les réponses aux questions les plus fréquentes.",
    iconTitle: "fr-icon-questionnaire-fill",
    link: {
      label: "Accéder à notre FAQ",
      url: "https://aide.immersion-facile.beta.gouv.fr/fr/",
    },
  },
];
const links: NavLink[] = [
  {
    label: "gouvernement.fr",
    href: "https://www.gouvernement.fr/",
  },
  {
    label: "service-public.fr",
    href: "https://www.service-public.fr/",
  },
];
const bottomsLinks: NavLink[] = [
  {
    label: "Mentions légales",
    href: "https://immersion-facile-1.gitbook.io/mentions-legales/",
    target: "_blank",
  },
  {
    label: "Politique de confidentialité",
    href: "https://immersion-facile-1.gitbook.io/mentions-legales/politique-de-confidentialite",
    target: "_blank",
  },
  {
    label: "Conditions générales d'utilisation",
    href: "https://immersion-facile-1.gitbook.io/mentions-legales/conditions-generales-dutilisation",
    target: "_blank",
  },
  {
    label: "Nous contacter",
    href: "mailto:contact@immersion-facile.beta.gouv.fr",
  },
  {
    label: "Statistiques",
    href: "https://immersion-facile-1.gitbook.io/la-page-stats-de-immersion-facilitee/mXyCG0khRml5mCWUU0Pe/la-mesure-de-limpact-dimmersion-facilitee",
    target: "_blank",
  },
];

export const ImmersionFooter = () => (
  <>
    <OverFooter cols={overFooterCols} />
    <Footer
      links={links}
      ministereLogo={<MinistereLogo />}
      partnersLogos={[<PoleEmploiLogo />, <EntreprisesLogo />]}
      bottomLinks={bottomsLinks}
    />
  </>
);
