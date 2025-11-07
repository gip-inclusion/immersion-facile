import type { Observable } from "rxjs";
import type {
  CreateDiscussionDto,
  DataWithPagination,
  GetExternalOffersFlatQueryParams,
  GetOffersFlatQueryParams,
  GroupSlug,
  GroupWithResults,
  SearchResultDto,
  SiretAndAppellationDto,
} from "shared";

export type ContactErrorKind = "alreadyContactedRecently";

export interface SearchGateway {
  getExternalOffers$(
    params: GetExternalOffersFlatQueryParams,
  ): Observable<DataWithPagination<SearchResultDto>>;
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
  ): Observable<SearchResultDto>;
}
