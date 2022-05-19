import axios from "axios";
import { map, Observable } from "rxjs";
import { ajax } from "rxjs/ajax";
import { ImmersionSearchGateway } from "src/core-logic/ports/ImmersionSearchGateway";
import { ContactEstablishmentRequestDto } from "shared/src/contactEstablishment";
import {
  contactEstablishmentRoute,
  searchImmersionRoute,
} from "shared/src/routes";
import { SearchImmersionRequestDto } from "shared/src/searchImmersion/SearchImmersionRequest.dto";
import { SearchImmersionResultDto } from "shared/src/searchImmersion/SearchImmersionResult.dto";

const prefix = "api";

export class HttpImmersionSearchGateway implements ImmersionSearchGateway {
  public search(
    searchParams: SearchImmersionRequestDto,
  ): Observable<SearchImmersionResultDto[]> {
    return ajax
      .get<SearchImmersionResultDto[]>(
        `/${prefix}/v1/${searchImmersionRoute}?rome=${searchParams.rome}
        &position.lon=${searchParams.position.lon}&position.lat=${searchParams.position.lat}
        &distance_km=${searchParams.distance_km}
        &voluntaryToImmersion=${searchParams.voluntaryToImmersion}`,
      )
      .pipe(map(({ response }) => response));
  }

  public async contactEstablishment(
    params: ContactEstablishmentRequestDto,
  ): Promise<void> {
    await axios.post(`/${prefix}/${contactEstablishmentRoute}`, params);
  }
}
