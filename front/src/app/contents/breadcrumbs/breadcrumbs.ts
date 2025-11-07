import type { BreadcrumbProps } from "@codegouvfr/react-dsfr/Breadcrumb";
import { makeBreadcrumbsSegments } from "src/app/utils/breadcrumbs";
import type { Route } from "type-route";
import {
  type FrontRouteKeys,
  type FrontRouteUnion,
  routes,
} from "../../routes/routes";

export type BreadcrumbsItem = {
  label: string;
  route: Route<FrontRouteUnion>;
  children?: {
    [K in FrontRouteKeys]?: BreadcrumbsItem;
  };
};

export type Breadcrumbs<T extends string> = {
  [K in T]?: BreadcrumbsItem;
};

export const defaultAncestor: BreadcrumbProps["segments"][0] = {
  label: "Accueil",
  linkProps: routes.home().link,
};

export const breadcrumbs: Breadcrumbs<FrontRouteKeys> = {
  homeAgencies: {
    label: "Organismes prescripteurs",
    route: routes.homeAgencies(),
    children: {
      addAgency: {
        label: "Inscrire mon organisme",
        route: routes.addAgency(),
      },
      agencyDashboardMain: {
        label: "Tableau de bord",
        route: routes.agencyDashboardMain(),
      },
      agencyDashboardAgencyDetails: {
        label: "Détail de l'organisme",
        route: routes.agencyDashboardAgencyDetails({ agencyId: "" }),
      },
    },
  },
  homeCandidates: {
    label: "Candidats",
    route: routes.homeCandidates(),
    children: {
      search: {
        label: "Recherche",
        route: routes.search(),
        children: {
          externalSearch: {
            label: "Résultats LaBonneBoite",
            route: routes.externalSearch(),
          },
        },
      },
      searchForStudent: {
        label: "Recherche scolaire",
        route: routes.searchForStudent(),
      },
      beneficiaryDashboard: {
        label: "Tableau de bord",
        route: routes.beneficiaryDashboard(),
      },
    },
  },
  homeEstablishments: {
    label: "Entreprises",
    route: routes.homeEstablishments(),
    children: {
      formEstablishment: {
        label: "Proposer une immersion",
        route: routes.formEstablishment(),
      },
      establishmentDashboard: {
        label: "Tableau de bord",
        route: routes.establishmentDashboard(),
      },
    },
  },
  initiateConvention: {
    label: "Initier une convention",
    route: routes.initiateConvention(),
    children: {
      conventionImmersion: {
        label: "Remplir la demande de convention",
        route: routes.conventionImmersion(),
      },
    },
  },
  assessment: {
    label: "Bilan d'immersion",
    route: routes.assessment({ jwt: "", conventionId: "" }),
  },
  myProfile: {
    label: "Mon profil",
    route: routes.myProfile(),
    children: {
      myProfileAgencyRegistration: {
        label: "Demander l'accès à des organismes",
        route: routes.myProfileAgencyRegistration(),
      },
    },
  },
  admin: {
    label: "Administration",
    route: routes.admin(),
  },
  establishmentDashboard: {
    label: "Tableau de bord entreprise",
    route: routes.establishmentDashboard(),
    children: {
      establishmentDashboardConventions: {
        label: "Conventions",
        route: routes.establishmentDashboardConventions(),
      },
      establishmentDashboardDiscussions: {
        label: "Discussions",
        route: routes.establishmentDashboardDiscussions(),
      },
      establishmentDashboardFormEstablishment: {
        label: "Fiche entreprise",
        route: routes.formEstablishment(),
      },
    },
  },
  magicLinkInterstitial: {
    label: "Connexion à Immersion Facilitée",
    route: routes.magicLinkInterstitial({ email: "", code: "", state: "" }),
  },
};

export const getBreadcrumbs = makeBreadcrumbsSegments<typeof breadcrumbs>(
  breadcrumbs,
  defaultAncestor,
);
