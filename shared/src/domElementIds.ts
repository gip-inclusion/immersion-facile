import { frontRoutes } from "./routes/routes";

type FrontRoutesKeys = keyof typeof frontRoutes | "layout" | "home";
type FrontRouteValue = string | Record<string, string>;
type FrontRoutesValues = Record<string, FrontRouteValue>;

type DomElementIds = Record<FrontRoutesKeys, FrontRoutesValues>;

export const domElementIds = {
  layout: {
    header: {},
    navigation: {
      home: "im-header-nav__home",
    },
    footer: {},
  },
  search: {
    placeAutocompleteInput: "im-search-page__address-autocomplete",
  },
  home: {},
  homeEstablishments: {
    siretModal: {
      siretFetcherInput: "siret-fetcher-input",
    },
  },
} satisfies DomElementIds;
