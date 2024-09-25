import { BreadcrumbProps } from "@codegouvfr/react-dsfr/Breadcrumb";
import { makeBreadcrumbsSegments } from "src/app/utils/breadcrumbs";
import { Route } from "type-route";
import { FrontRouteKeys, FrontRouteUnion, routes } from "../../routes/routes";

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
      agencyDashboard: {
        label: "Tableau de bord",
        route: routes.agencyDashboard(),
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
      },
      searchDiagoriente: {
        label: "Recherche (langage naturel)",
        route: routes.searchDiagoriente(),
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
};

export const getBreadcrumbs = makeBreadcrumbsSegments<typeof breadcrumbs>(
  breadcrumbs,
  defaultAncestor,
);
