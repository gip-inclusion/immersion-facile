import { Observable } from "rxjs";
import {
  ContactEstablishmentRequestDto,
  EstablishmentGroupSlug,
  SearchQueryParamsDto,
  SearchResultDto,
  SiretAndAppellationDto,
} from "shared";

export type ContactErrorKind = "alreadyContactedRecently";

export interface SearchGateway {
  search$(searchParams: SearchQueryParamsDto): Observable<SearchResultDto[]>;
  contactEstablishment: (
    params: ContactEstablishmentRequestDto,
  ) => Promise<void | ContactErrorKind>;
  getGroupSearchResultsBySlug(
    groupSlug: EstablishmentGroupSlug,
  ): Promise<SearchResultDto[]>;
  getSearchResult$(params: SiretAndAppellationDto): Observable<SearchResultDto>;
}
