import { AxiosInstance, AxiosResponse } from "axios";
import { from, map, Observable } from "rxjs";

import {
  AppellationMatchDto,
  appellationRoute,
  appellationSearchResponseSchema,
  queryParamsAsString,
  RomeDto,
  romeListSchema,
  romeRoute,
  RomeSearchInput,
} from "shared";

import { RomeAutocompleteGateway } from "src/core-logic/ports/RomeAutocompleteGateway";

export class HttpRomeAutocompleteGateway implements RomeAutocompleteGateway {
  constructor(private readonly httpClient: AxiosInstance) {}

  public getRomeDtoMatching(searchText: string): Observable<RomeDto[]> {
    const queryParams = queryParamsAsString<RomeSearchInput>({ searchText });
    return from(
      this.httpClient.get<unknown>(`/${romeRoute}?${queryParams}`),
    ).pipe(map(validateRomeList));
  }

  public async getAppellationDtoMatching(
    searchText: string,
  ): Promise<AppellationMatchDto[]> {
    const { data } = await this.httpClient.get<unknown>(
      `/${appellationRoute}`,
      {
        params: { searchText },
      },
    );
    const appelationsDto = appellationSearchResponseSchema.parse(data);
    return appelationsDto;
  }
}
const validateRomeList = ({ data }: AxiosResponse<unknown>): RomeDto[] =>
  romeListSchema.parse(data);
