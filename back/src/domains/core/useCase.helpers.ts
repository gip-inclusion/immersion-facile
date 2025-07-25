import type { SearchQueryParamsDto } from "shared";

export const getSearchParams = (
  useCaseName: string,
  params: unknown,
): SearchQueryParamsDto | undefined => {
  if (useCaseName === "SearchImmersion") return params as SearchQueryParamsDto;
};

export const extractValue = (
  propName: string,
  params: unknown,
): string | undefined => {
  if (typeof params !== "object" || params === null) return undefined;

  if (propName in params) {
    return (params as Record<string, unknown>)[propName] as string;
  }

  for (const value of Object.values(params)) {
    if (typeof value === "object" && value !== null && propName in value) {
      return (value as Record<string, unknown>)[propName] as string;
    }
  }

  return undefined;
};
