import { from, Observable } from "rxjs";
import {
  ImmersionOfferTargets,
  SearchImmersionResultDto,
  WithSiretAndAppellation,
} from "shared";
import { HttpClient } from "http-client";
import { ImmersionOfferGateway } from "src/core-logic/ports/ImmersionOfferGateway";

export class HttpImmersionOfferGateway implements ImmersionOfferGateway {
  #httpClient: HttpClient<ImmersionOfferTargets>;

  constructor(httpClient: HttpClient<ImmersionOfferTargets>) {
    this.#httpClient = httpClient;
  }

  public getImmersionOffer$(
    params: WithSiretAndAppellation,
  ): Observable<SearchImmersionResultDto> {
    return from(
      this.#getImmersionOffer(params).then((response) => response.responseBody),
    );
  }

  #getImmersionOffer(params: WithSiretAndAppellation) {
    return this.#httpClient.getImmersionOffer({
      queryParams: params,
    });
  }
}
