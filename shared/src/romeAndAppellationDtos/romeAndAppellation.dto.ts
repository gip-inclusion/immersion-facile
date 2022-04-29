import { Flavor } from "../typeFlavors";

export type RomeCode = Flavor<string, "CodeRome">;
export type AppellationCode = Flavor<string, "CodeRome">;

export type RomeSearchInput = {
  searchText: string;
};

export type RomeDto = {
  romeLabel: string;
  romeCode: RomeCode;
};

export type AppellationDto = RomeDto & {
  appellationLabel: string;
  appellationCode: AppellationCode;
};

export type MatchRangeDto = {
  startIndexInclusive: number;
  endIndexExclusive: number;
};

export type AppellationMatchDto = {
  appellation: AppellationDto;
  matchRanges: MatchRangeDto[];
};
