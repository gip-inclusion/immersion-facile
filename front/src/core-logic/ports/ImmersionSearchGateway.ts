import { Observable } from "rxjs";
import {
  ContactEstablishmentRequestDto,
  EstablishmentGroupSlug,
  SearchImmersionQueryParamsDto,
  SearchImmersionResultDto,
} from "shared";

export type ContactErrorKind = "alreadyContactedRecently";

export interface ImmersionSearchGateway {
  search(
    searchParams: SearchImmersionQueryParamsDto,
  ): Observable<SearchImmersionResultDto[]>;
  contactEstablishment: (
    params: ContactEstablishmentRequestDto,
  ) => Promise<void | ContactErrorKind>;
  getGroupOffersBySlug(
    groupSlug: EstablishmentGroupSlug,
  ): Promise<SearchImmersionResultDto[]>;
}
