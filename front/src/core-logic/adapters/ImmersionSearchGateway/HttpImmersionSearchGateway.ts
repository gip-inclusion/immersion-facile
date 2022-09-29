import { AxiosInstance, AxiosResponse } from "axios";
import { from, map, Observable } from "rxjs";
import {
  ContactEstablishmentRequestDto,
  contactEstablishmentRoute,
  immersionOffersRoute,
  queryParamsAsString,
  SearchImmersionQueryParamsDto,
  SearchImmersionResultDto,
  searchImmersionsSchema,
} from "shared";

import { ImmersionSearchGateway } from "src/core-logic/ports/ImmersionSearchGateway";

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
