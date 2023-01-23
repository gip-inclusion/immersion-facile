import lesEntrepriseSengagent from "/img/les-entreprises-s-engagent.svg";
import poleEmploiLogo from "/img/pole-emploi-logo.svg";
import plateformeLogo from "/img/plateforme-inclusion-logo.svg";
import React from "react";
import { makeStyles, useStyles } from "tss-react/dsfr";
import { fr } from "@codegouvfr/react-dsfr";
import { Footer, NavLink } from "react-design-system";
import {
  OverFooter,
  OverFooterCols,
} from "react-design-system/immersionFacile";
import { routes } from "src/app/routes/routes";
import { immersionFacileContactEmail } from "shared";
import { useIsDark } from "@codegouvfr/react-dsfr/useIsDark";

const getFooterNavLinkId = (chunk: string) => `im-footer-nav__${chunk}`;

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

const PartnersLogos = () => {
  const { cx } = useStyles();
  const darkModeState = useIsDark();
  const { classes } = makeStyles({ name: ImmersionFooter.displayName })(() => ({
    partnerLogo: {
      filter: darkModeState.isDark ? "invert(1) grayscale(1)" : "",
    },
  }))();
  return (
    <>
      <img
        src={poleEmploiLogo}
        alt="Pole Emploi"
        style={{ margin: "0 1.5rem" }}
        className={cx(
          fr.cx("fr-footer__partners-link"),
          "im-footer__partner-link",
          classes.partnerLogo,
        )}
      />
      <img
        src={lesEntrepriseSengagent}
        alt="Les entreprises s'engagent"
        className={cx(
          fr.cx("fr-footer__partners-link"),
          "im-footer__partner-link",
          classes.partnerLogo,
        )}
      />
      <img
        src={plateformeLogo}
        alt="Plateforme de l'Inclusion"
        className={cx(
          fr.cx("fr-footer__partners-link"),
          "im-footer__partner-link",
          classes.partnerLogo,
        )}
      />
    </>
  );
};

const overFooterCols: OverFooterCols = [
  {
    title: "Le centre d'aide",
    subtitle:
      "Consultez notre FAQ, trouvez les réponses aux questions les plus fréquentes et contactez-nous si vous n'avez pas trouvé de réponse",
    iconTitle: "fr-icon-questionnaire-fill",
    link: {
      label: "Accédez à notre FAQ",
      url: "https://aide.immersion-facile.beta.gouv.fr/fr/",
    },
    id: getFooterNavLinkId("over-faq"),
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
    id: getFooterNavLinkId("over-linkedin"),
  },
  {
    title: "Les chiffres-clé de notre impact",
    subtitle:
      "Vous souhaitez en savoir plus sur les résultats atteints par Immersion Facilitée ?",
    iconTitle: "fr-icon-line-chart-line",
    link: {
      label: "Nos statistiques",
      url: routes.stats().link.href,
    },
    id: getFooterNavLinkId("over-contact"),
  },
];
const links: NavLink[] = [
  {
    label: "gouvernement.fr",
    href: "https://www.gouvernement.fr/",
    id: getFooterNavLinkId("gouv"),
  },
  {
    label: "service-public.fr",
    href: "https://www.service-public.fr/",
    id: getFooterNavLinkId("service-public"),
  },
];
const bottomsLinks: NavLink[] = [
  {
    label: "Accessibilité : partiellement conforme",
    ...routes.standard({ pagePath: "declaration-accessibilite" }).link,
    id: getFooterNavLinkId("accessibility"),
  },
  {
    label: "Mentions légales",
    ...routes.standard({ pagePath: "mentions-legales" }).link,
    id: getFooterNavLinkId("legals"),
  },
  {
    label: "Politique de confidentialité",
    ...routes.standard({ pagePath: "politique-de-confidentialite" }).link,
    id: getFooterNavLinkId("privacy"),
  },
  {
    label: "Conditions générales d'utilisation",
    ...routes.standard({ pagePath: "cgu" }).link,
    id: getFooterNavLinkId("cgu"),
  },
  {
    label: "Nous contacter",
    href: `mailto:${immersionFacileContactEmail}`,
    id: getFooterNavLinkId("contact"),
  },
  {
    label: "Statistiques",
    href: "/stats",
    target: "_blank",
    id: getFooterNavLinkId("stats"),
  },
  {
    label: "Plan du site",
    ...routes.standard({ pagePath: "plan-du-site" }).link,
    id: getFooterNavLinkId("sitemap"),
  },
];

export const ImmersionFooter = () => (
  <>
    <OverFooter cols={overFooterCols} />
    <Footer
      links={links}
      ministereLogo={<MinistereLogo />}
      partnersLogos={<PartnersLogos />}
      bottomLinks={bottomsLinks}
    />
  </>
);

ImmersionFooter.displayName = "ImmersionFooter";
