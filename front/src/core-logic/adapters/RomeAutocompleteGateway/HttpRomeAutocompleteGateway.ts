import { AxiosInstance, AxiosResponse } from "axios";
import { from, map, Observable } from "rxjs";
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
  romeListSchema,
} from "shared/src/romeAndAppellationDtos/romeAndAppellation.schema";

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
