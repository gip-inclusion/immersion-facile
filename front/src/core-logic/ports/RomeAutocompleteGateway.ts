import {
  AppellationMatchDto,
  RomeDto,
} from "src/shared/romeAndAppellationDtos/romeAndAppellation.dto";

export interface RomeAutocompleteGateway {
  getRomeDtoMatching: (searchText: string) => Promise<RomeDto[]>;
  getAppellationDtoMatching: (
    searchText: string,
  ) => Promise<AppellationMatchDto[]>;
}
