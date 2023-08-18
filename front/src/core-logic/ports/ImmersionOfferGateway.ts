import { Observable } from "rxjs";
import { SearchImmersionResultDto, WithSiretAndAppellation } from "shared";

export interface ImmersionOfferGateway {
  getImmersionOffer(
    params: WithSiretAndAppellation,
  ): Observable<SearchImmersionResultDto>;
}
