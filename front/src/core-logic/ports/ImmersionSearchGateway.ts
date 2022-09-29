import { Observable } from "rxjs";
import {
  ContactEstablishmentRequestDto,
  SearchImmersionQueryParamsDto,
  SearchImmersionResultDto,
} from "shared";

export interface ImmersionSearchGateway {
  search(
    searchParams: SearchImmersionQueryParamsDto,
  ): Observable<SearchImmersionResultDto[]>;
  contactEstablishment: (
    params: ContactEstablishmentRequestDto,
  ) => Promise<void>;
}
