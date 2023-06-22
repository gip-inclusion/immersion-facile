import { Flavor } from "../typeFlavors";

export type RomeCode = Flavor<string, "CodeRome">;
export type AppellationCode = Flavor<string, "AppellationCode">;

export const ROME_AND_APPELLATION_MIN_SEARCH_TEXT_LENGTH = 2;

export type RomeSearchInput = {
  searchText: string;
};

export type RomeDto = {
  romeLabel: string;
  romeCode: RomeCode;
};

export type AppellationDto_To_Rename = {
  appellationLabel: string;
  appellationCode: AppellationCode;
};

export type AppellationAndRomeDto = RomeDto & AppellationDto_To_Rename;

export type MatchRangeDto = {
  startIndexInclusive: number;
  endIndexExclusive: number;
};

export type AppellationMatchDto = {
  appellation: AppellationAndRomeDto;
  matchRanges: MatchRangeDto[];
};
