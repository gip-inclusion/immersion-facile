import { from, Observable } from "rxjs";
import { GetSiretInfo, SiretDto, SiretTargets } from "shared";
import { HttpClient } from "http-client";
import { SiretGatewayThroughBack } from "src/core-logic/ports/SiretGatewayThroughBack";

export class HttpSiretGatewayThroughBack implements SiretGatewayThroughBack {
  constructor(private readonly httpClient: HttpClient<SiretTargets>) {}

  isSiretAlreadySaved(siret: SiretDto): Observable<boolean> {
    return from(
      this.httpClient
        .isSiretAlreadySaved({ urlParams: { siret } })
        .then(({ responseBody }) => responseBody),
    );
  }

  // public isSiretAlreadyInSaved(siret: SiretDto): Observable<boolean> {}

  public getSiretInfo(siret: SiretDto): Observable<GetSiretInfo> {
    return from(
      this.httpClient
        .getSiretInfo({ urlParams: { siret } })
        .then(({ responseBody }) => responseBody),
    );
  }

  public getSiretInfoIfNotAlreadySaved(
    siret: SiretDto,
  ): Observable<GetSiretInfo> {
    return from(
      this.httpClient
        .getSiretInfoIfNotAlreadySaved({ urlParams: { siret } })
        .then(({ responseBody }) => responseBody),
    );
  }
}
