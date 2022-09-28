import { Observable } from "rxjs";
import { ContactEstablishmentRequestDto } from "shared";
import { SearchImmersionQueryParamsDto } from "shared";
import { SearchImmersionResultDto } from "shared";

export interface ImmersionSearchGateway {
  search(
    searchParams: SearchImmersionQueryParamsDto,
  ): Observable<SearchImmersionResultDto[]>;
  contactEstablishment: (
    params: ContactEstablishmentRequestDto,
  ) => Promise<void>;
}
