import { Observable, Subject } from "rxjs";
import { SearchImmersionResultDto, WithSiretAndAppellation } from "shared";
import { ImmersionOfferGateway } from "src/core-logic/ports/ImmersionOfferGateway";

export class TestImmersionOfferGateway implements ImmersionOfferGateway {
  public currentImmersionOffer$ = new Subject<SearchImmersionResultDto>();

  public getImmersionOffer(
    _params: WithSiretAndAppellation,
  ): Observable<SearchImmersionResultDto> {
    return this.currentImmersionOffer$;
  }
}
