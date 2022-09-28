import { AxiosInstance, AxiosResponse } from "axios";
import { from, map, Observable } from "rxjs";

import { ImmersionSearchGateway } from "src/core-logic/ports/ImmersionSearchGateway";
import { ContactEstablishmentRequestDto } from "shared";
import { contactEstablishmentRoute, immersionOffersRoute } from "shared";
import { SearchImmersionQueryParamsDto } from "shared";
import { SearchImmersionResultDto } from "shared";
import { queryParamsAsString } from "shared";

import { searchImmersionsSchema } from "shared";

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
