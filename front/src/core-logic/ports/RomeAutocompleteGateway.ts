import { Observable } from "rxjs";
import {
  AppellationMatchDto,
  RomeDto,
} from "shared/src/romeAndAppellationDtos/romeAndAppellation.dto";

export interface RomeAutocompleteGateway {
  getRomeDtoMatching: (searchText: string) => Observable<RomeDto[]>;
  getAppellationDtoMatching: (
    searchText: string,
  ) => Promise<AppellationMatchDto[]>;
}
