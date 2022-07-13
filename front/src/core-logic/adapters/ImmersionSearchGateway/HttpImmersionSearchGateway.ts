import axios from "axios";
import { map, Observable } from "rxjs";
import { ajax } from "rxjs/ajax";
import { ImmersionSearchGateway } from "src/core-logic/ports/ImmersionSearchGateway";
import { ContactEstablishmentRequestDto } from "shared/src/contactEstablishment";
import {
  contactEstablishmentRoute,
  immersionOffersRoute,
} from "shared/src/routes";
import { SearchImmersionQueryParamsDto } from "shared/src/searchImmersion/SearchImmersionQueryParams.dto";
import { SearchImmersionResultDto } from "shared/src/searchImmersion/SearchImmersionResult.dto";
import { queryParamsAsString } from "shared/src/utils/queryParams";
import { validateDataFromSchema } from "shared/src/zodUtils";
import { searchImmersionsSchema } from "shared/src/searchImmersion/SearchImmersionResult.schema";

const prefix = "api";

export class HttpImmersionSearchGateway implements ImmersionSearchGateway {
  public search(
    searchParams: SearchImmersionQueryParamsDto,
  ): Observable<SearchImmersionResultDto[]> {
    return ajax
      .get<unknown>(
        `/${prefix}/${immersionOffersRoute}?${queryParamsAsString<SearchImmersionQueryParamsDto>(
          searchParams,
        )}`,
      )
      .pipe(
        map(({ response }) => {
          const formEstablishmentDto = validateDataFromSchema(
            searchImmersionsSchema,
            response,
          );
          if (formEstablishmentDto instanceof Error) throw formEstablishmentDto;
          return formEstablishmentDto;
        }),
      );
  }

  public async contactEstablishment(
    params: ContactEstablishmentRequestDto,
  ): Promise<void> {
    await axios.post(`/${prefix}/${contactEstablishmentRoute}`, params);
  }
}
