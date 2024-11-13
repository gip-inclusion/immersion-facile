export const getUrlParameters: (location: Location) => {
  [k: string]: string;
} = (location) =>
  Object.fromEntries(new URLSearchParams(location.search).entries());

export const filterParamsForRoute = <T>({
  urlParams,
  matchingParams,
  forceExcludeParams,
}: {
  urlParams: T extends Record<string, unknown> ? T : Record<string, unknown>;
  matchingParams: Record<string, unknown>;
  forceExcludeParams?: string[];
}) =>
  Object.fromEntries(
    Object.entries(urlParams).filter(
      ([key, value]) =>
        key in matchingParams && value && !forceExcludeParams?.includes(key),
    ),
  );
