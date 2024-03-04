import { Flavor } from "../typeFlavors";

export type RomeCode = Flavor<string, "CodeRome">;
export type AppellationCode = Flavor<string, "AppellationCode">;
export type RomeLabel = Flavor<string, "RomeLabel">;
export type AppellationLabel = Flavor<string, "AppellationLabel">;

export const ROME_AND_APPELLATION_MIN_SEARCH_TEXT_LENGTH = 2;

export type RomeSearchInput = {
  searchText: string;
};

export type RomeDto = {
  romeLabel: RomeLabel;
  romeCode: RomeCode;
};

export type AppellationDto = {
  appellationLabel: AppellationLabel;
  appellationCode: AppellationCode;
};

export type AppellationAndRomeDto = RomeDto & AppellationDto;

export type MatchRangeDto = {
  startIndexInclusive: number;
  endIndexExclusive: number;
};

export type AppellationMatchDto = {
  appellation: AppellationAndRomeDto;
  matchRanges: MatchRangeDto[];
};

export const emptyAppellationAndRome: AppellationAndRomeDto = {
  romeCode: "",
  appellationCode: "",
  romeLabel: "",
  appellationLabel: "",
};
