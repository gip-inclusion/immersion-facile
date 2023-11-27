import React from "react";
import { fr } from "@codegouvfr/react-dsfr";
import { useIsDark } from "@codegouvfr/react-dsfr/useIsDark";
import { makeStyles, useStyles } from "tss-react/dsfr";
import { domElementIds } from "shared";
import {
  Footer,
  NavLink,
  OverFooter,
  OverFooterCols,
} from "react-design-system";
import { routes } from "src/app/routes/routes";

import lesEntrepriseSengagent from "/assets/img/les-entreprises-s-engagent.svg";
import plateformeLogo from "/assets/img/plateforme-inclusion-logo.svg";
import poleEmploiLogo from "/assets/img/pole-emploi-logo.svg";

const {
  bottomLinks: bottomsLinksIds,
  links: linksIds,
  overFooterCols: overFooterColsIds,
} = domElementIds.footer;

const TopFooter = () => {
  const { cx } = useStyles();
  return (
    <div className={fr.cx("fr-footer__top")}>
      <div className={fr.cx("fr-container")}>
        <p>test</p>
      </div>
    </div>
  );
};

const PlateformeSoloLogo = () => {
  const { cx } = useStyles();
  const darkModeState = useIsDark();
  const { classes } = makeStyles({ name: LayoutFooter.displayName })(() => ({
    partnerLogo: {
      filter: darkModeState.isDark ? "invert(1) grayscale(1)" : "",
    },
  }))();
  return (
    <div>
      <p>
        <strong> Ce service fait partie de la </strong>
      </p>
      <div className={fr.cx("fr-footer__brand")}>
        <img
          src={plateformeLogo}
          alt="Plateforme de l'Inclusion"
          className={cx(
            fr.cx("fr-footer__logo"),
            "im-footer__logo",
            classes.partnerLogo,
          )}
          style={{ height: "5.625rem" }}
        />
        <div>
          <p>
            Découvrez les outils qui portent l'inclusion au cœur de leur
            service. À chaque service, son objectif.
            <a
              className={fr.cx(
                "fr-footer__content-link",
                "fr-icon-external-link-line",
                "fr-link--icon-right",
              )}
              style={{ justifyContent: "start" }}
              href={""}
            >
              Découvrez nos services
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export const MinistereLogo = () => (
  <div className={fr.cx("fr-footer__logo")}>
    <p className={fr.cx("fr-logo")} style={{ fontSize: "1rem" }}>
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
  const { classes } = makeStyles({ name: LayoutFooter.displayName })(() => ({
    partnerLogo: {
      filter: darkModeState.isDark ? "invert(1) grayscale(1)" : "",
    },
  }))();
  return (
    <ul>
      <li>
        <MinistereLogo />
      </li>
      <li>
        <img
          src={poleEmploiLogo}
          alt="Pole Emploi"
          style={{ margin: "0 1.5rem" }}
          className={cx(
            fr.cx("fr-footer__logo"),
            "im-footer__logo",
            classes.partnerLogo,
          )}
        />
      </li>
      <li>
        <img
          src={lesEntrepriseSengagent}
          alt="Les entreprises s'engagent"
          className={cx(
            fr.cx("fr-footer__logo"),
            "im-footer__logo",
            classes.partnerLogo,
          )}
        />
      </li>
    </ul>
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
    id: overFooterColsIds.faq,
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
    id: overFooterColsIds.linkedin,
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
    id: overFooterColsIds.contact,
  },
];
const links: NavLink[] = [
  {
    label: "gouvernement.fr",
    href: "https://www.gouvernement.fr/",
    id: linksIds.gouv,
    target: "_blank",
  },
  {
    label: "service-public",
    href: "https://www.service-public.fr/",
    id: linksIds.civilService,
    target: "_blank",
  },
  {
    label: "La plateforme de l'inclusion",
    href: "https://inclusion-experimentation.beta.gouv.fr/",
    id: linksIds.inclusion,
    target: "_blank",
  },
];
const bottomsLinks: NavLink[] = [
  {
    label: "Accessibilité : partiellement conforme",
    ...routes.standard({ pagePath: "accessibilite" }).link,
    id: bottomsLinksIds.accessibility,
  },
  {
    label: "Mentions légales",
    ...routes.standard({ pagePath: "mentions-legales" }).link,
    id: bottomsLinksIds.legals,
  },
  {
    label: "Politique de confidentialité",
    ...routes.standard({ pagePath: "politique-de-confidentialite" }).link,
    id: bottomsLinksIds.privacy,
  },
  {
    label: "Conditions générales d'utilisation",
    ...routes.standard({ pagePath: "cgu" }).link,
    id: bottomsLinksIds.cgu,
  },
  {
    label: "Nous contacter",
    href: "https://aide.immersion-facile.beta.gouv.fr/fr/",
    id: bottomsLinksIds.contact,
    target: "_blank",
  },
  {
    label: "Statistiques",
    href: "/stats",
    target: "_blank",
    id: bottomsLinksIds.stats,
  },
  {
    label: "Plan du site",
    ...routes.standard({ pagePath: "plan-du-site" }).link,
    id: bottomsLinksIds.sitemap,
  },
  {
    label: "Budget",
    ...routes.standard({ pagePath: "budget" }).link,
    id: bottomsLinksIds.budget,
  },
  {
    label: "Documentation API",
    href: "/doc-api",
    id: bottomsLinksIds.apiDocumentation,
  },
];

export const LayoutFooter = () => (
  <>
    <OverFooter cols={overFooterCols} />
    <Footer
      topFooter={<TopFooter />}
      links={links}
      ministereLogo={<PlateformeSoloLogo />}
      partnersLogos={<PartnersLogos />}
      bottomLinks={bottomsLinks}
    />
  </>
);

LayoutFooter.displayName = "LayoutFooter";
