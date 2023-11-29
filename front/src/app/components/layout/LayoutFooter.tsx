import React from "react";
import { fr } from "@codegouvfr/react-dsfr";
import { MainNavigationProps } from "@codegouvfr/react-dsfr/MainNavigation";
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
import poleEmploiLogo from "/assets/img/pole-emploi-logo.svg";
const {
  bottomLinks: bottomsLinksIds,
  links: linksIds,
  overFooterCols: overFooterColsIds,
} = domElementIds.footer;

const TopFooter = ({ links }: { links: MainNavigationProps.Item[] }) => (
  <div className={fr.cx("fr-footer__top")}>
    <div className={fr.cx("fr-container")}>
      <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
        {links.map((link) => (
          <div
            className={fr.cx("fr-col-12", "fr-col-sm-3", "fr-col-md-2")}
            key={link.linkProps?.id}
          >
            <h3 className={fr.cx("fr-footer__top-cat")}>{link.text}</h3>
            {link.menuLinks && link.menuLinks.length > 0 && (
              <ul className={fr.cx("fr-footer__top-list")}>
                {link.menuLinks.map((children) => (
                  <li key={children.linkProps.id}>
                    <a
                      className={fr.cx("fr-footer__top-link")}
                      href={children.linkProps.href}
                    >
                      {children.text}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  </div>
);

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
    iconTitle: "fr-icon-linkedin-box-fill",
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
const {
  candidate: candidateIds,
  establishment: establishmentIds,
  agency: agencyIds,
} = domElementIds.header.navLinks;

const topNavlinks: MainNavigationProps.Item[] = [
  {
    text: "Candidats",
    menuLinks: [
      {
        text: "Trouver une entreprise accueillante",
        linkProps: {
          ...routes.search().link,
          id: candidateIds.search,
        },
      },
      {
        text: "Remplir la demande de convention",
        linkProps: {
          ...routes.conventionImmersion().link,
          id: candidateIds.formConvention,
        },
      },
    ],
  },
  {
    text: "Entreprises",
    menuLinks: [
      {
        text: "Référencer mon entreprise",
        linkProps: {
          ...routes.formEstablishment().link,
          id: establishmentIds.addEstablishmentForm,
        },
      },
      {
        text: "Remplir la demande de convention",
        linkProps: {
          ...routes.conventionImmersion().link,
          id: establishmentIds.formConvention,
        },
      },
    ],
  },
  {
    text: "Prescripteurs",
    menuLinks: [
      {
        text: "Référencer mon organisme",
        linkProps: {
          ...routes.addAgency().link,
          id: agencyIds.addAgencyForm,
        },
      },
      {
        text: "Remplir la demande de convention",
        linkProps: {
          ...routes.conventionImmersion().link,
          id: agencyIds.formConvention,
        },
      },
    ],
  },
  {
    text: "Réseaux sociaux",
    menuLinks: [
      {
        text: "Rejoignez nous sur Linkedin",
        linkProps: {
          href: "https://www.linkedin.com/company/l-immersion-facilitee/",
          id: agencyIds.addAgencyForm,
        },
      },
    ],
  },
];

export const LayoutFooter = () => (
  <>
    <OverFooter cols={overFooterCols} />
    <Footer
      topFooter={<TopFooter links={topNavlinks} />}
      links={links}
      partnersLogos={<PartnersLogos />}
      bottomLinks={bottomsLinks}
    />
  </>
);

LayoutFooter.displayName = "LayoutFooter";
