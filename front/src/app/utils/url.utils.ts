export const getUrlParameters: (location: Location) => {
  [k: string]: string;
} = (location) =>
  Object.fromEntries(new URLSearchParams(location.search).entries());

export const filterParamsForRoute = (
  urlParams: Record<string, unknown>,
  matchingParams: Record<string, unknown>,
  forceExcludeParams?: string[],
) =>
  Object.fromEntries(
    Object.entries(urlParams).filter(
      ([key]) => key in matchingParams && !forceExcludeParams?.includes(key),
    ),
  );
