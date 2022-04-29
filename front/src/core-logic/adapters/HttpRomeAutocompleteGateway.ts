import axios from "axios";
import { Observable } from "rxjs";
import { ajax } from "rxjs/ajax";
import { RomeAutocompleteGateway } from "src/core-logic/ports/RomeAutocompleteGateway";
import {
  AppellationMatchDto,
  RomeDto,
  RomeSearchInput,
} from "shared/src/romeAndAppellationDtos/romeAndAppellation.dto";
import { appellationRoute, romeRoute } from "shared/src/routes";
import { queryParamsAsString } from "shared/src/utils/queryParams";

const prefix = "api";

export class HttpRomeAutocompleteGateway implements RomeAutocompleteGateway {
  public getRomeDtoMatching(searchText: string): Observable<RomeDto[]> {
    const queryParams = queryParamsAsString<RomeSearchInput>({ searchText });
    return ajax.getJSON(`/${prefix}/${romeRoute}?${queryParams}`);
  }

  public async getAppellationDtoMatching(
    searchText: string,
  ): Promise<AppellationMatchDto[]> {
    const httpResponse = await axios.get(`/${prefix}/${appellationRoute}`, {
      params: { searchText },
    });

    return httpResponse.data;
  }
}
