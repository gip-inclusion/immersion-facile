export const getUrlParameters: (location: Location) => {
  [k: string]: string;
} = (location) =>
  Object.fromEntries(new URLSearchParams(location.search).entries());

export const filteredUrlParamsForRoute = (
  urlParams: Record<string, string>,
  matchingParams: Record<string, unknown>,
) =>
  Object.fromEntries(
    Object.entries(urlParams).filter(([key]) => key in matchingParams),
  );
