import { Observable } from "rxjs";

import {
  ContactEstablishmentRequestDto,
  EstablishmentGroupSlug,
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
  getGroupOffersBySlug(
    groupSlug: EstablishmentGroupSlug,
  ): Promise<SearchImmersionResultDto[]>;
}
