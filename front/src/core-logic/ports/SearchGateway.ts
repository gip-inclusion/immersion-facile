import type { Observable } from "rxjs";
import type {
  CreateDiscussionDto,
  DataWithPagination,
  ExternalSearchResultDto,
  GetExternalOffersFlatQueryParams,
  GetOffersFlatQueryParams,
  GroupSlug,
  GroupWithResults,
  SearchResultDto,
  SiretAndAppellationDto,
} from "shared";

export type ContactErrorKind = "alreadyContactedRecently";

export interface SearchGateway {
  getOffers$(
    params: GetOffersFlatQueryParams,
  ): Observable<DataWithPagination<SearchResultDto>>;
  contactEstablishment: (
    params: CreateDiscussionDto,
  ) => Promise<void | ContactErrorKind>;
  getGroupBySlug(groupSlug: GroupSlug): Promise<GroupWithResults>;
  getSearchResult$(params: SiretAndAppellationDto): Observable<SearchResultDto>;
  getExternalSearchResult$(
    params: SiretAndAppellationDto,
  ): Observable<ExternalSearchResultDto>;
  getExternalOffers$(
    params: GetExternalOffersFlatQueryParams,
  ): Observable<DataWithPagination<ExternalSearchResultDto>>;
}
