import { Observable } from "rxjs";
import {
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
}
