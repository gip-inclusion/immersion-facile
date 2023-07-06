import { domElementIds } from "shared";
import { routes } from "src/app/routes/routes";

// TODO replace with react dsfr link props type
type SiteMapLink = {
  text: string;
  linkProps: {
    href: string;
    id: string;
  };
};

const { siteMap: siteMapIds } = domElementIds.standard;

const siteMapLinks: SiteMapLink[] = [
  {
    text: "Accueil",
    linkProps: {
      ...routes.home().link,
      id: siteMapIds.home,
    },
  },
  {
    text: "Accueil candidat",
    linkProps: {
      ...routes.homeCandidates().link,
      id: siteMapIds.candidateHome,
    },
  },
  {
    text: "Accueil entreprise",
    linkProps: {
      ...routes.homeEstablishments().link,
      id: siteMapIds.establishmentHome,
    },
  },
  {
    text: "Accueil prescripteurs",
    linkProps: {
      ...routes.homeAgencies().link,
      id: siteMapIds.agencyHome,
    },
  },
  {
    text: "Trouver une entreprise accueillante",
    linkProps: {
      ...routes.search().link,
      id: siteMapIds.search,
    },
  },
  {
    text: "Remplir la demande de convention",
    linkProps: {
      ...routes.conventionImmersion().link,
      id: siteMapIds.coventionForm,
    },
  },
  {
    text: "Référencer une entreprise",
    linkProps: {
      ...routes.formEstablishment().link,
      id: siteMapIds.establishmentForm,
    },
  },
  {
    text: "Référencer un organisme",
    linkProps: {
      ...routes.addAgency().link,
      id: siteMapIds.agencyForm,
    },
  },
  {
    text: "Déclaration d'accessibilité",
    linkProps: {
      ...routes.standard({ pagePath: "declaration-accessibilite" }).link,
      id: siteMapIds.accessibility,
    },
  },
  {
    text: "Mentions légales",
    linkProps: {
      ...routes.standard({ pagePath: "mentions-legales" }).link,
      id: siteMapIds.legals,
    },
  },
  {
    text: "Politique de confidentialité",
    linkProps: {
      ...routes.standard({ pagePath: "politique-de-confidentialite" }).link,
      id: siteMapIds.privacy,
    },
  },
  {
    text: "Conditions générales d'utilisation",
    linkProps: {
      ...routes.standard({ pagePath: "cgu" }).link,
      id: siteMapIds.cgu,
    },
  },
  {
    text: "Statistiques",
    linkProps: {
      href: "/stats",
      id: siteMapIds.stats,
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
