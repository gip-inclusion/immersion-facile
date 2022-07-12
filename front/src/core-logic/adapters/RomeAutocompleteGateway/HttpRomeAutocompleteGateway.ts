import axios from "axios";
import { map, Observable } from "rxjs";
import { ajax } from "rxjs/ajax";
import { RomeAutocompleteGateway } from "src/core-logic/ports/RomeAutocompleteGateway";
import {
  AppellationMatchDto,
  RomeDto,
  RomeSearchInput,
} from "shared/src/romeAndAppellationDtos/romeAndAppellation.dto";
import { appellationRoute, romeRoute } from "shared/src/routes";
import { queryParamsAsString } from "shared/src/utils/queryParams";
import {
  appellationSearchResponseSchema,
  romeListResponseSchema,
} from "shared/src/romeAndAppellationDtos/romeAndAppellation.schema";
import { validateDataFromSchema } from "shared/src/zodUtils";

const prefix = "api";

export class HttpRomeAutocompleteGateway implements RomeAutocompleteGateway {
  public getRomeDtoMatching(searchText: string): Observable<RomeDto[]> {
    const queryParams = queryParamsAsString<RomeSearchInput>({ searchText });
    return ajax.getJSON<unknown>(`/${prefix}/${romeRoute}?${queryParams}`).pipe(
      map((response) => {
        const romeListResponse = validateDataFromSchema(
          romeListResponseSchema,
          response,
        );
        if (romeListResponse instanceof Error) throw romeListResponse;
        return romeListResponse.data;
      }),
    );
  }

  public async getAppellationDtoMatching(
    searchText: string,
  ): Promise<AppellationMatchDto[]> {
    const { data } = await axios.get<unknown>(
      `/${prefix}/${appellationRoute}`,
      {
        params: { searchText },
      },
    );
    const appelationsDto = validateDataFromSchema(
      appellationSearchResponseSchema,
      data,
    );
    if (appelationsDto instanceof Error) throw appelationsDto;
    return appelationsDto;
  }
}
