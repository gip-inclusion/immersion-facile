import type { BreadcrumbProps } from "@codegouvfr/react-dsfr/Breadcrumb";
import { makeBreadcrumbsSegments } from "src/app/utils/breadcrumbs";
import type { Route } from "type-route";

describe("makeBreadcrumbsSegments", () => {
  it("should returns segments for a route at level 1", () => {
    const segments = getTestBreadcrumbs({
      currentRouteKey: "homeCandidates",
    });
    expect(segments).toEqual([
      {
        label: "Accueil",
        linkProps: {
          href: "/",
          onClick: expect.any(Function),
        },
      },
      {
        label: "Candidats",
        linkProps: {
          href: "/homeCandidates",
          onClick: expect.any(Function),
        },
      },
    ]);
  });
  it("should returns segments for a route at a deep level", () => {
    const segments = getTestBreadcrumbs({
      currentRouteKey: "search",
    });
    expect(segments).toEqual([
      {
        label: "Accueil",
        linkProps: {
          href: "/",
          onClick: expect.any(Function),
        },
      },
      {
        label: "Candidats",
        linkProps: {
          href: "/homeCandidates",
          onClick: expect.any(Function),
        },
      },
      {
        label: "Recherche",
        linkProps: {
          href: "/search",
          onClick: expect.any(Function),
        },
      },
    ]);
  });

  it("should returns segments for a route without its siblings", () => {
    const segments = getTestBreadcrumbs({
      currentRouteKey: "beneficiaryDashboard",
    });
    expect(segments).toEqual([
      {
        label: "Accueil",
        linkProps: {
          href: "/",
          onClick: expect.any(Function),
        },
      },
      {
        label: "Candidats",
        linkProps: {
          href: "/homeCandidates",
          onClick: expect.any(Function),
        },
      },
      {
        label: "Tableau de bord",
        linkProps: {
          href: "/beneficiaryDashboard",
          onClick: expect.any(Function),
        },
      },
    ]);
  });
});

const makeFakeRoute = (name: string): Route<any> => ({
  name,
  link: {
    href: `/${name}`,
    onClick: () => {},
  },
  action: null,
  params: {},
  href: `/${name}`,
  push: () => {},
  replace: () => {},
});

const testBreadcrumbsSet = {
  homeCandidates: {
    label: "Candidats",
    route: makeFakeRoute("homeCandidates"),
    children: {
      search: {
        label: "Recherche",
        route: makeFakeRoute("search"),
      },

      beneficiaryDashboard: {
        label: "Tableau de bord",
        route: makeFakeRoute("beneficiaryDashboard"),
      },
    },
  },
};

const testRootAncestor: BreadcrumbProps["segments"][0] = {
  label: "Accueil",
  linkProps: {
    href: "/",
    onClick: () => {},
  },
};

const getTestBreadcrumbs = makeBreadcrumbsSegments<typeof testBreadcrumbsSet>(
  testBreadcrumbsSet,
  testRootAncestor,
);

// Type safety tests

getTestBreadcrumbs({
  // @ts-expect-error
  currentRouteKey: "not-known-route-name",
});

getTestBreadcrumbs({
  // root at level 1
  currentRouteKey: "homeCandidates",
});

getTestBreadcrumbs({
  // deep level
  currentRouteKey: "search",
});
