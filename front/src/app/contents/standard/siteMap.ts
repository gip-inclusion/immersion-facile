import { routes } from "src/app/routes/routes";

// TODO replace with react dsfr link props type
type SiteMapLink = {
  text: string;
  linkProps: {
    href: string;
    id: string;
  };
};

const getSitemapNavLinkId = (chunk: string) => `im-sitemap-nav__${chunk}`;

const siteMapLinks: SiteMapLink[] = [
  {
    text: "Accueil",
    linkProps: {
      ...routes.home().link,
      id: getSitemapNavLinkId("home"),
    },
  },
  {
    text: "Accueil candidat",
    linkProps: {
      ...routes.homeCandidates().link,
      id: getSitemapNavLinkId("candidate-home"),
    },
  },
  {
    text: "Accueil entreprise",
    linkProps: {
      ...routes.homeEstablishments().link,
      id: getSitemapNavLinkId("establishment-home"),
    },
  },
  {
    text: "Accueil prescripteurs",
    linkProps: {
      ...routes.homeAgencies().link,
      id: getSitemapNavLinkId("agency-home"),
    },
  },
  {
    text: "Trouver une entreprise accueillante",
    linkProps: {
      ...routes.search().link,
      id: getSitemapNavLinkId("search"),
    },
  },
  {
    text: "Remplir la demande de convention",
    linkProps: {
      ...routes.conventionImmersion().link,
      id: getSitemapNavLinkId("covention-form"),
    },
  },
  {
    text: "Référencer une entreprise",
    linkProps: {
      ...routes.formEstablishment().link,
      id: getSitemapNavLinkId("establishment-form"),
    },
  },
  {
    text: "Référencer un organisme",
    linkProps: {
      ...routes.addAgency().link,
      id: getSitemapNavLinkId("agency-form"),
    },
  },
  {
    text: "Déclaration d'accessibilité",
    linkProps: {
      ...routes.standard({ pagePath: "declaration-accessibilite" }).link,
      id: getSitemapNavLinkId("accessibility"),
    },
  },
  {
    text: "Mentions légales",
    linkProps: {
      ...routes.standard({ pagePath: "mentions-legales" }).link,
      id: getSitemapNavLinkId("legals"),
    },
  },
  {
    text: "Politique de confidentialité",
    linkProps: {
      ...routes.standard({ pagePath: "politique-de-confidentialite" }).link,
      id: getSitemapNavLinkId("privacy"),
    },
  },
  {
    text: "Conditions générales d'utilisation",
    linkProps: {
      ...routes.standard({ pagePath: "cgu" }).link,
      id: getSitemapNavLinkId("cgu"),
    },
  },
  {
    text: "Statistiques",
    linkProps: {
      href: "/stats",
      id: getSitemapNavLinkId("stats"),
    },
  },
];

export default {
  title: "Plan du site",
  content: `
  <ul>${siteMapLinks
    .map(
      (link) =>
        `<li><a class="fr-link fr-fi-arrow-right-line fr-link--icon-right" href=${link.linkProps.href} id=${link.linkProps.id}>${link.text}</a></li>`,
    )
    .join("")} 
  </ul>
  `,
};
