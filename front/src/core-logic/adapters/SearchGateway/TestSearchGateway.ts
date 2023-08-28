import { Observable, Subject } from "rxjs";
import {
  ContactEstablishmentRequestDto,
  EstablishmentGroupSlug,
  SearchQueryParamsDto,
  SearchResultDto,
  SiretAndAppellationDto,
} from "shared";
import { SearchGateway } from "src/core-logic/ports/SearchGateway";

export class TestSearchGateway implements SearchGateway {
  public contactEstablishmentResponse$ = new Subject<
    void | "alreadyContactedRecently"
  >();

  public currentSearchResult$ = new Subject<SearchResultDto>();

  public searchResults$ = new Subject<SearchResultDto[]>();

  public contactEstablishment(
    _params: ContactEstablishmentRequestDto,
  ): Promise<void | "alreadyContactedRecently"> {
    throw new Error("Method not implemented.");
  }

  public getGroupSearchResultsBySlug(
    _groupSlug: EstablishmentGroupSlug,
  ): Promise<SearchResultDto[]> {
    throw new Error("Method not implemented.");
  }

  public getSearchResult$(
    _params: SiretAndAppellationDto,
  ): Observable<SearchResultDto> {
    return this.currentSearchResult$;
  }

  public search$(_params: SearchQueryParamsDto): Observable<SearchResultDto[]> {
    return this.searchResults$;
  }
}
