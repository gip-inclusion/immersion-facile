import axios from "axios";
import { Observable } from "rxjs";
import { ajax } from "rxjs/ajax";
import { RomeAutocompleteGateway } from "src/core-logic/ports/RomeAutocompleteGateway";
import {
  AppellationMatchDto,
  RomeDto,
  RomeSearchInput,
} from "src/shared/romeAndAppellationDtos/romeAndAppellation.dto";
import { appellationRoute, romeRoute } from "src/shared/routes";
import { queryParamsAsString } from "src/shared/utils/queryParams";

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
