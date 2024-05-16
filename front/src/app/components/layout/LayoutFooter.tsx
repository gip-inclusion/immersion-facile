import { fr } from "@codegouvfr/react-dsfr";
import { useIsDark } from "@codegouvfr/react-dsfr/useIsDark";
import React from "react";
import {
  Footer,
  FooterStyles,
  MinistereEmploiLogo,
  NavLink,
  NavTopGroupLinks,
  OverFooter,
  OverFooterCols,
} from "react-design-system";
import { domElementIds } from "shared";
import { getConsentModal } from "src/app/components/ConsentManager";
import { routes } from "src/app/routes/routes";
import { makeStyles, useStyles } from "tss-react/dsfr";
import lesEntrepriseSengagent from "../../../assets/img/les-entreprises-s-engagent.svg";
import franceTravailLogo from "../../../assets/img/logo-france-travail.svg";
import plateformeInclusionLogoUrl from "../../../assets/img/plateforme-inclusion-logo.svg";
const {
  bottomLinks: bottomsLinksIds,
  links: linksIds,
  navTopGroupLinks: navTopGroupLinksIds,
  overFooterCols: overFooterColsIds,
} = domElementIds.footer;

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
        <MinistereEmploiLogo />
      </li>
      <li>
        <img
          src={franceTravailLogo}
          alt="France Travail"
          className={cx(
            fr.cx("fr-footer__logo", "fr-mx-1w"),
            FooterStyles.default.logo,
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
            FooterStyles.default.logo,
            classes.partnerLogo,
          )}
        />
      </li>
    </ul>
  );
};

export const PlateformeInclusionLogo = () => {
  const { cx } = useStyles();
  const darkModeState = useIsDark();
  const { classes } = makeStyles()(() => ({
    partnerLogo: {
      filter: darkModeState.isDark ? "invert(1) grayscale(1)" : "",
    },
  }))();
  return (
    <img
      src={plateformeInclusionLogoUrl}
      alt="Plateforme de l'Inclusion"
      className={cx(
        fr.cx("fr-footer__logo", "fr-m-2w", "fr-m-md-0", "fr-mr-md-2w"),
        classes.partnerLogo,
        FooterStyles.default.logo,
      )}
    />
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
      url: "https://immersion-facile.beta.gouv.fr/aide/",
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
    label: "beta.gouv.fr",
    href: "https://beta.gouv.fr/",
    id: linksIds.gouv,
    target: "_blank",
  },
  {
    label: "data.gouv.fr",
    href: "https://www.data.gouv.fr/",
    id: linksIds.civilService,
    target: "_blank",
  },
  {
    label: "api.gouv.fr",
    href: "https://api.gouv.fr/",
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
    href: "https://immersion-facile.beta.gouv.fr/aide/",
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
  {
    label: "Gestion des cookies",
    id: "fr-consent-modal-control-button",
    href: "#fr-consent-modal",
    onClick: (event) => {
      event.preventDefault();
      const { modalElementDSFR, modalElement } = getConsentModal();
      modalElementDSFR.disclose();
      if (modalElement) {
        modalElement.setAttribute("aria-hidden", "false");
        modalElement.setAttribute("data-fr-opened", "true");
      }
    },
  },
  {
    label: "Kit de communication",
    href: "https://inclusion.beta.gouv.fr/kits-de-communication/immersion-facilitée/",
    id: bottomsLinksIds.communicationKit,
    target: "_blank",
  },
];

const navTopGroupLinks: NavTopGroupLinks[] = [
  {
    title: "Candidats",
    links: [
      {
        label: "Trouver une entreprise accueillante",
        ...routes.search().link,
        id: navTopGroupLinksIds.search,
      },
      {
        label: "Remplir la demande de convention",
        ...routes.conventionImmersion().link,
        id: `${navTopGroupLinksIds.formConvention}-candidats`,
      },
    ],
  },
  {
    title: "Entreprises",
    links: [
      {
        label: "Référencer mon entreprise",
        ...routes.formEstablishment().link,
        id: navTopGroupLinksIds.addEstablishmentForm,
      },
      {
        label: "Remplir la demande de convention",
        ...routes.conventionImmersion().link,
        id: `${navTopGroupLinksIds.formConvention}-entreprises`,
      },
    ],
  },
  {
    title: "Prescripteurs",
    links: [
      {
        label: "Référencer mon organisme",
        ...routes.addAgency().link,
        id: navTopGroupLinksIds.addAgencyForm,
      },
      {
        label: "Remplir la demande de convention",
        ...routes.conventionImmersion().link,
        id: navTopGroupLinksIds.agencyformConvention,
      },
    ],
  },
  {
    title: "Réseaux sociaux",
    links: [
      {
        label: (
          <>
            <i className={fr.cx("fr-icon-linkedin-box-fill", "fr-icon--sm")} />
            Rejoignez-nous sur Linkedin
          </>
        ),
        href: "https://www.linkedin.com/company/l-immersion-facilitee/",
        id: navTopGroupLinksIds.linkedin,
      },
    ],
  },
];

export const LayoutFooter = () => (
  <>
    <OverFooter cols={overFooterCols} />
    <Footer
      navTopGroupLinks={navTopGroupLinks}
      links={links}
      partnersLogos={<PartnersLogos />}
      bottomLinks={bottomsLinks}
      plateformeInclusionLogo={<PlateformeInclusionLogo />}
    />
  </>
);

LayoutFooter.displayName = "LayoutFooter";
