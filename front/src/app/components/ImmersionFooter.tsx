import lesEntrepriseSengagent from "/les-entreprises-s-engagent.svg";
import poleEmploiLogo from "/pole-emploi-logo.svg";
import React from "react";
import { NavLink } from "src/../../libs/react-design-system";

import { Footer } from "src/../../libs/react-design-system";

export const MinistereLogo = () => (
  <div className="fr-footer__brand fr-enlarge-link fr-footer__partners-main">
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
);

const PoleEmploiLogo = () => (
  <img src={poleEmploiLogo} alt="Pole Emploi" style={{ margin: "0 1.5rem" }} />
);
const EntreprisesLogo = () => (
  <img src={lesEntrepriseSengagent} alt="Les entreprises s'engagent" />
);

export const ImmersionFooter = () => {
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
  return (
    <Footer
      links={links}
      ministereLogo={<MinistereLogo />}
      partnersLogos={[<PoleEmploiLogo />, <EntreprisesLogo />]}
      bottomLinks={bottomsLinks}
    />
  );
};
