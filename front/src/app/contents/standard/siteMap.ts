import { RegisteredLinkProps } from "@codegouvfr/react-dsfr/link";
import { domElementIds } from "shared";
import { routes } from "src/app/routes/routes";

const { siteMap: siteMapIds } = domElementIds.standard;

const siteMapLinks: RegisteredLinkProps[] = [
  {
    title: "Accueil",
    id: siteMapIds.home,
    ...routes.home().link,
  },
  {
    title: "Accueil candidat",
    id: siteMapIds.candidateHome,
    ...routes.homeCandidates().link,
  },
  {
    title: "Accueil entreprise",
    id: siteMapIds.establishmentHome,
    ...routes.homeEstablishments().link,
  },
  {
    title: "Accueil prescripteurs",
    id: siteMapIds.agencyHome,
    ...routes.homeAgencies().link,
  },
  {
    title: "Trouver une entreprise accueillante",
    id: siteMapIds.search,
    ...routes.search().link,
  },
  {
    title: "Remplir la demande de convention",
    id: siteMapIds.coventionForm,
    ...routes.conventionImmersion().link,
  },
  {
    title: "Référencer une entreprise",
    id: siteMapIds.establishmentForm,
    ...routes.formEstablishment().link,
  },
  {
    title: "Référencer un organisme",
    id: siteMapIds.agencyForm,
    ...routes.addAgency().link,
  },
  {
    title: "Déclaration d'accessibilité",
    id: siteMapIds.accessibility,
    ...routes.standard({ pagePath: "declaration-accessibilite" }).link,
  },
  {
    title: "Mentions légales",
    id: siteMapIds.legals,
    ...routes.standard({ pagePath: "mentions-legales" }).link,
  },
  {
    title: "Politique de confidentialité",
    ...routes.standard({ pagePath: "politique-de-confidentialite" }).link,
    id: siteMapIds.privacy,
  },
  {
    title: "Conditions générales d'utilisation",
    ...routes.standard({ pagePath: "cgu" }).link,
    id: siteMapIds.cgu,
  },
  {
    title: "Statistiques",
    href: "/stats",
    id: siteMapIds.stats,
  },
];

export default {
  title: "Plan du site",
  content: `
  <ul>${siteMapLinks
    .map(
      (link) =>
        `<li><a class="fr-link fr-fi-arrow-right-line fr-link--icon-right" href=${link.href} id=${link.id}>${link.title}</a></li>`,
    )
    .join("")} 
  </ul>
  `,
};
