import { BreadcrumbProps } from "@codegouvfr/react-dsfr/Breadcrumb";
import { flatten } from "ramda";
import { keys } from "shared";
import { Route } from "type-route";
import { FrontRouteKeys, FrontRouteUnion, routes } from "../../routes/routes";

export type BreadcrumbsItem = {
  label: string;
  route: Route<FrontRouteUnion>;
  children?: {
    [K in FrontRouteKeys]?: BreadcrumbsItem;
  };
};

export type Breadcrumbs = {
  [K in FrontRouteKeys]?: BreadcrumbsItem;
};

export const breadcrumbs: Breadcrumbs = {
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

export const makeBreadcrumbsSegments = (
  currentRouteKey: FrontRouteKeys,
): BreadcrumbProps["segments"] => {
  const currentRouteAncestor = keys(breadcrumbs).find((key) => {
    const currentRouteInBreadcrumbs = breadcrumbs[key];
    if (!currentRouteInBreadcrumbs) return false;
    return (
      currentRouteInBreadcrumbs.route.name === currentRouteKey ||
      isRouteInChildren(currentRouteKey, currentRouteInBreadcrumbs)
    );
  });
  return [
    {
      label: "Accueil",
      linkProps: routes.home().link,
    },
    ...(currentRouteAncestor && breadcrumbs[currentRouteAncestor]
      ? formatToBreadcrumbsSegments(
          breadcrumbs[currentRouteAncestor],
          currentRouteKey,
        )
      : []),
  ];
};

const isRouteInChildren = (
  currentRouteKey: FrontRouteKeys,
  breadcrumbsItem: BreadcrumbsItem,
): boolean => {
  const children = breadcrumbsItem.children;
  if (!children) return false;
  return keys(children).some((key) => {
    const child = children[key];
    if (!child) return false;
    if (child.route.name === currentRouteKey) return true;
    if (child.children) {
      return isRouteInChildren(currentRouteKey, child);
    }
  });
};

const formatToBreadcrumbsSegments = (
  ancestor: BreadcrumbsItem,
  currentRouteKey: FrontRouteKeys,
): BreadcrumbProps["segments"] => {
  const { label, route, children } = ancestor;
  const ancestorSegment = { label, linkProps: route.link };
  if (!children || ancestor.route.name === currentRouteKey)
    return [ancestorSegment];
  const childSegments = flatten(
    keys(children).map((key) => {
      const child = children[key];

      if (!child) return;

      const { route, label, children: childChildren } = child;
      const { name: routeName, link: linkProps } = route;

      if (
        isRouteInChildren(currentRouteKey, child) &&
        routeName !== currentRouteKey &&
        childChildren
      ) {
        return formatToBreadcrumbsSegments(child, currentRouteKey);
      }
      if (routeName !== currentRouteKey) return;

      return {
        label,
        linkProps,
      };
    }),
  ).filter((child) => child !== undefined);
  return [ancestorSegment, ...childSegments];
};
