import type { BreadcrumbProps } from "@codegouvfr/react-dsfr/Breadcrumb";
import {
  type FrontRouteKeys,
  type FrontRouteUnion,
  frontRoutes,
  useRoute,
} from "shared";
import { makeBreadcrumbsSegments } from "src/app/utils/breadcrumbs";
import type { Route } from "type-route";

export type BreadcrumbsItem = {
  label: string;
  route: Route<FrontRouteUnion> | (() => Route<FrontRouteUnion>);
  children?: {
    [K in FrontRouteKeys]?: BreadcrumbsItem;
  };
};

export type Breadcrumbs<T extends string> = {
  [K in T]?: BreadcrumbsItem;
};

export const defaultAncestor: BreadcrumbProps["segments"][0] = {
  label: "Accueil",
  linkProps: frontRoutes.home().link,
};

export const breadcrumbs: Breadcrumbs<FrontRouteKeys> = {
  homeAgencies: {
    label: "Organismes prescripteurs",
    route: frontRoutes.homeAgencies(),
    children: {
      addAgency: {
        label: "Inscrire mon organisme",
        route: frontRoutes.addAgency(),
      },
      agencyDashboardMain: {
        label: "Tableau de bord",
        route: frontRoutes.agencyDashboardMain(),
      },
      agencyDashboardAgencyDetails: {
        label: "Détail de l'organisme",
        route: frontRoutes.agencyDashboardAgencyDetails({ agencyId: "" }),
      },
    },
  },
  homeCandidates: {
    label: "Candidats",
    route: frontRoutes.homeCandidates(),
    children: {
      search: {
        label: "Recherche",
        route: () => {
          const route = useRoute();
          return frontRoutes.search(
            route.name === "externalSearch" ? route.params : {},
          );
        },
        children: {
          externalSearch: {
            label: "Résultats LaBonneBoite",
            route: frontRoutes.externalSearch(),
          },
        },
      },
      searchForStudent: {
        label: "Recherche scolaire",
        route: frontRoutes.searchForStudent(),
      },
      beneficiaryDashboard: {
        label: "Tableau de bord",
        route: frontRoutes.beneficiaryDashboard(),
      },
    },
  },
  homeEstablishments: {
    label: "Entreprises",
    route: frontRoutes.homeEstablishments(),
    children: {
      formEstablishment: {
        label: "Proposer une immersion",
        route: frontRoutes.formEstablishment(),
      },
      establishmentDashboard: {
        label: "Tableau de bord",
        route: frontRoutes.establishmentDashboard(),
      },
    },
  },
  initiateConvention: {
    label: "Initier une convention",
    route: frontRoutes.initiateConvention(),
    children: {
      conventionImmersion: {
        label: "Remplir la demande de convention",
        route: frontRoutes.conventionImmersion(),
      },
    },
  },
  assessment: {
    label: "Bilan d'immersion",
    route: frontRoutes.assessment({ jwt: "", conventionId: "" }),
  },
  assessmentDocument: {
    label: "Bilan d'immersion",
    route: frontRoutes.assessmentDocument({ jwt: "", conventionId: "" }),
  },
  myProfile: {
    label: "Mon profil",
    route: frontRoutes.myProfile(),
    children: {
      myProfileAgencyRegistration: {
        label: "Demander l'accès à des organismes",
        route: frontRoutes.myProfileAgencyRegistration(),
      },
      myProfileEstablishmentRegistration: {
        label: "Se rattacher à une entreprise",
        route: frontRoutes.myProfileEstablishmentRegistration(),
      },
    },
  },
  admin: {
    label: "Administration",
    route: frontRoutes.admin(),
  },
  establishmentDashboard: {
    label: "Tableau de bord entreprise",
    route: frontRoutes.establishmentDashboard(),
    children: {
      establishmentDashboardConventions: {
        label: "Conventions",
        route: frontRoutes.establishmentDashboardConventions(),
      },
      establishmentDashboardDiscussions: {
        label: "Discussions",
        route: frontRoutes.establishmentDashboardDiscussions(),
      },
      establishmentDashboardFormEstablishment: {
        label: "Fiche entreprise",
        route: frontRoutes.formEstablishment(),
      },
    },
  },
  beneficiaryDashboard: {
    label: "Tableau de bord bénéficiaire",
    route: frontRoutes.beneficiaryDashboard(),
    children: {
      beneficiaryDashboardDiscussions: {
        label: "Candidatures",
        route: frontRoutes.beneficiaryDashboardDiscussions(),
      },
    },
  },
  magicLinkInterstitial: {
    label: "Connexion à Immersion Facilitée",
    route: frontRoutes.magicLinkInterstitial({
      email: "",
      code: "",
      state: "",
    }),
  },
};

export const getBreadcrumbs = makeBreadcrumbsSegments<typeof breadcrumbs>(
  breadcrumbs,
  defaultAncestor,
);
