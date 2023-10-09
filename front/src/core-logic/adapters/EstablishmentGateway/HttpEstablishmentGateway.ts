import { from, Observable } from "rxjs";
import {
  BackOfficeJwt,
  EstablishmentJwt,
  EstablishmentRoutes,
  FormEstablishmentDto,
  SiretDto,
} from "shared";
import { HttpClient } from "shared-routes";
import { EstablishmentGateway } from "src/core-logic/ports/EstablishmentGateway";

export class HttpEstablishmentGateway implements EstablishmentGateway {
  constructor(private readonly httpClient: HttpClient<EstablishmentRoutes>) {}

  public addFormEstablishment$(
    formEstablishment: FormEstablishmentDto,
  ): Observable<void> {
    return from(
      this.httpClient
        .addFormEstablishment({ body: formEstablishment })
        .then(({ status, body }) => {
          if (status === 200) return;
          throw new Error(body);
        }),
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
        .then(({ body, status }) => {
          if (status === 204) return;
          throw new Error(JSON.stringify(body));
        }),
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
        .then(({ body, status }) => {
          if (status === 200) return body;
          throw new Error(JSON.stringify(body));
        }),
    );
  }

  public requestEstablishmentModification$(siret: SiretDto): Observable<void> {
    return from(
      this.httpClient
        .requestEmailToUpdateFormRoute({
          urlParams: { siret },
        })
        .then(({ body, status }) => {
          if (status === 201) return;
          throw new Error(JSON.stringify(body));
        }),
    );
  }

  public updateFormEstablishment$(
    formEstablishment: FormEstablishmentDto,
    jwt: EstablishmentJwt | BackOfficeJwt,
  ): Observable<void> {
    return from(
      this.httpClient
        .updateFormEstablishment({
          body: formEstablishment,
          headers: {
            authorization: jwt,
          },
        })
        .then(({ body, status }) => {
          if (status === 200) return;
          throw new Error(JSON.stringify(body));
        }),
    );
  }
}
