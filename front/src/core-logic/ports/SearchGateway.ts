import type { Observable } from "rxjs";
import type {
  ContactEstablishmentRequestDto,
  GroupSlug,
  GroupWithResults,
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
  getGroupBySlug(groupSlug: GroupSlug): Promise<GroupWithResults>;
  getSearchResult$(params: SiretAndAppellationDto): Observable<SearchResultDto>;
  getExternalSearchResult$(
    params: SiretAndAppellationDto,
  ): Observable<SearchResultDto>;
}
