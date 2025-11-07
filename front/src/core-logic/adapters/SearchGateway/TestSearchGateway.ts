import { type Observable, Subject } from "rxjs";
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
import type { SearchGateway } from "src/core-logic/ports/SearchGateway";

export class TestSearchGateway implements SearchGateway {
  public currentSearchResult$ = new Subject<SearchResultDto>();

  public searchResults$ = new Subject<DataWithPagination<SearchResultDto>>();

  public externalSearchResults$ = new Subject<
    DataWithPagination<SearchResultDto>
  >();

  public contactEstablishment(
    _params: CreateDiscussionDto,
  ): Promise<void | "alreadyContactedRecently"> {
    throw new Error("Method not implemented.");
  }

  public getGroupBySlug(_groupSlug: GroupSlug): Promise<GroupWithResults> {
    throw new Error("Method not implemented.");
  }

  public getSearchResult$(
    _params: SiretAndAppellationDto,
  ): Observable<SearchResultDto> {
    return this.currentSearchResult$;
  }

  public getExternalOffers$(
    _params: GetExternalOffersFlatQueryParams,
  ): Observable<DataWithPagination<SearchResultDto>> {
    return this.externalSearchResults$;
  }

  public getOffers$(
    _params: GetOffersFlatQueryParams,
  ): Observable<DataWithPagination<SearchResultDto>> {
    return this.searchResults$;
  }

  public getExternalSearchResult$(
    _params: SiretAndAppellationDto,
  ): Observable<SearchResultDto> {
    return this.currentSearchResult$;
  }
}
