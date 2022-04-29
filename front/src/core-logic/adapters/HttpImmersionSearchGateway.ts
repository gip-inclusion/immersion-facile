import axios from "axios";
import { map, Observable } from "rxjs";
import { ajax } from "rxjs/ajax";
import { ImmersionSearchGateway } from "src/core-logic/ports/ImmersionSearchGateway";
import { ContactEstablishmentRequestDto } from "src/shared/contactEstablishment";
import {
  contactEstablishmentRoute,
  searchImmersionRoute,
} from "src/shared/routes";
import { SearchImmersionRequestDto } from "src/shared/searchImmersion/SearchImmersionRequest.dto";
import { SearchImmersionResultDto } from "src/shared/searchImmersion/SearchImmersionResult.dto";

const prefix = "api";

export class HttpImmersionSearchGateway implements ImmersionSearchGateway {
  public search(
    searchParams: SearchImmersionRequestDto,
  ): Observable<SearchImmersionResultDto[]> {
    return ajax
      .post<SearchImmersionResultDto[]>(
        `/${prefix}/v1/${searchImmersionRoute}`,
        searchParams,
      )
      .pipe(map(({ response }) => response));
  }

  public async contactEstablishment(
    params: ContactEstablishmentRequestDto,
  ): Promise<void> {
    await axios.post(`/${prefix}/${contactEstablishmentRoute}`, params);
  }
}
