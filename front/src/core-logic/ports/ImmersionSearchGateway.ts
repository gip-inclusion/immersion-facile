import { Observable } from "rxjs";
import { ContactEstablishmentRequestDto } from "shared/src/contactEstablishment";
import { SearchImmersionRequestDto } from "shared/src/searchImmersion/SearchImmersionRequest.dto";
import { SearchImmersionResultDto } from "shared/src/searchImmersion/SearchImmersionResult.dto";

export interface ImmersionSearchGateway {
  search(
    searchParams: SearchImmersionRequestDto,
  ): Observable<SearchImmersionResultDto[]>;
  contactEstablishment: (
    params: ContactEstablishmentRequestDto,
  ) => Promise<void>;
}
