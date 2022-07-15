import { AxiosInstance, AxiosResponse } from "axios";
import { from, map, Observable } from "rxjs";

import { ImmersionSearchGateway } from "src/core-logic/ports/ImmersionSearchGateway";
import { ContactEstablishmentRequestDto } from "shared/src/contactEstablishment";
import {
  contactEstablishmentRoute,
  immersionOffersRoute,
} from "shared/src/routes";
import { SearchImmersionQueryParamsDto } from "shared/src/searchImmersion/SearchImmersionQueryParams.dto";
import { SearchImmersionResultDto } from "shared/src/searchImmersion/SearchImmersionResult.dto";
import { queryParamsAsString } from "shared/src/utils/queryParams";

import { searchImmersionsSchema } from "shared/src/searchImmersion/SearchImmersionResult.schema";

export class HttpImmersionSearchGateway implements ImmersionSearchGateway {
  constructor(private readonly httpClient: AxiosInstance) {}

  public search(
    searchParams: SearchImmersionQueryParamsDto,
  ): Observable<SearchImmersionResultDto[]> {
    return from(
      this.httpClient.get<unknown>(
        `/${immersionOffersRoute}?${queryParamsAsString<SearchImmersionQueryParamsDto>(
          searchParams,
        )}`,
      ),
    ).pipe(map(validateSearchImmersions));
  }

  public async contactEstablishment(
    params: ContactEstablishmentRequestDto,
  ): Promise<void> {
    await this.httpClient.post(`/${contactEstablishmentRoute}`, params);
  }
}

const validateSearchImmersions = ({ data }: AxiosResponse<unknown>) =>
  searchImmersionsSchema.parse(data);
