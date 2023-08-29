import { AppellationCode, RomeCode, SearchQueryParamsDto } from "shared";

type SearchSortedBy = "distance" | "date";

export type SearchParamsPublicV2 = {
  longitude: number;
  latitude: number;
  rome?: RomeCode;
  appellationCodes?: AppellationCode | AppellationCode[];
  distanceKm: number;
  sortedBy?: SearchSortedBy;
  voluntaryToImmersion?: boolean;
};

export const searchParamsPublicV2ToDomain = ({
  appellationCodes,
  ...rest
}: SearchParamsPublicV2): SearchQueryParamsDto => {
  const modifiedFields: Partial<SearchQueryParamsDto> = appellationCodes
    ? {
        appellationCode:
          typeof appellationCodes === "string"
            ? appellationCodes
            : appellationCodes.at(0),
      }
    : {};

  return {
    ...rest,
    ...modifiedFields,
  };
};
