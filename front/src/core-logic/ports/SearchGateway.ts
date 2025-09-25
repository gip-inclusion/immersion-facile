import type { Observable } from "rxjs";
import type {
  CreateDiscussionDto,
  GroupSlug,
  GroupWithResults,
  LegacySearchQueryParamsDto,
  SearchResultDto,
  SiretAndAppellationDto,
} from "shared";

export type ContactErrorKind = "alreadyContactedRecently";

export interface SearchGateway {
  search$(
    searchParams: LegacySearchQueryParamsDto,
  ): Observable<SearchResultDto[]>;
  contactEstablishment: (
    params: CreateDiscussionDto,
  ) => Promise<void | ContactErrorKind>;
  getGroupBySlug(groupSlug: GroupSlug): Promise<GroupWithResults>;
  getSearchResult$(params: SiretAndAppellationDto): Observable<SearchResultDto>;
  getExternalSearchResult$(
    params: SiretAndAppellationDto,
  ): Observable<SearchResultDto>;
}
