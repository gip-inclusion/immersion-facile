import { from, Observable } from "rxjs";
import {
  BackOfficeJwt,
  EstablishmentJwt,
  EstablishmentTargets,
  FormEstablishmentDto,
  SiretDto,
} from "shared";
import { HttpClient } from "http-client";
import { EstablishmentGateway } from "src/core-logic/ports/EstablishmentGateway";

export class HttpEstablishmentGateway implements EstablishmentGateway {
  constructor(private readonly httpClient: HttpClient<EstablishmentTargets>) {}

  public addFormEstablishment$(
    formEstablishment: FormEstablishmentDto,
  ): Observable<void> {
    return from(
      this.httpClient
        .addFormEstablishment({
          body: formEstablishment,
        })
        .then((response) => response.responseBody),
    );
  }

  public deleteEstablishment$(
    siret: SiretDto,
    jwt: BackOfficeJwt,
  ): Observable<void> {
    return from(
      this.httpClient
        .deleteEstablishment({
          urlParams: { siret },
          headers: { authorization: jwt },
        })
        .then((response) => response.responseBody),
    );
  }

  public getFormEstablishmentFromJwt$(
    siret: SiretDto,
    jwt: EstablishmentJwt | BackOfficeJwt,
  ): Observable<FormEstablishmentDto> {
    return from(
      this.httpClient
        .getFormEstablishment({
          urlParams: { siret },
          headers: { authorization: jwt },
        })
        .then((response) => response.responseBody),
    );
  }

  public requestEstablishmentModification$(siret: SiretDto): Observable<void> {
    return from(
      this.httpClient
        .requestEmailToUpdateFormRoute({
          urlParams: { siret },
        })
        .then((response) => response.responseBody),
    );
  }

  public updateFormEstablishment$(
    formEstablishment: FormEstablishmentDto,
    jwt: EstablishmentJwt,
  ): Observable<void> {
    return from(
      this.httpClient
        .updateFormEstablishment({
          body: formEstablishment,
          headers: {
            authorization: jwt,
          },
        })
        .then((response) => response.responseBody),
    );
  }
}
