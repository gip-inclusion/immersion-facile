import { Observable, from } from "rxjs";
import {
  BackOfficeJwt,
  EstablishmentJwt,
  EstablishmentRoutes,
  FormEstablishmentDto,
  SiretDto,
} from "shared";
import { HttpClient } from "shared-routes";
import { EstablishmentGateway } from "src/core-logic/ports/EstablishmentGateway";
import { P, match } from "ts-pattern";
import { otherwiseThrow } from "../otherwiseThrow";

export class HttpEstablishmentGateway implements EstablishmentGateway {
  constructor(private readonly httpClient: HttpClient<EstablishmentRoutes>) {}

  public addFormEstablishment$(
    formEstablishment: FormEstablishmentDto,
  ): Observable<void> {
    return from(
      this.httpClient
        .addFormEstablishment({ body: formEstablishment })
        .then((response) =>
          match(response)
            .with({ status: 200 }, () => {
              /* void */
            })
            .otherwise(otherwiseThrow),
        ),
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
        .then((response) =>
          match(response)
            .with({ status: 204 }, () => {
              /* void */
            })
            .with({ status: P.union(404, 400, 403) }, ({ body }) => {
              throw new Error(JSON.stringify(body));
            })
            .otherwise(otherwiseThrow),
        )
        .catch((error) => {
          //Todo temporary fix due to probable shared route bug
          if (
            error instanceof Error &&
            error.message.includes("Received status: 204.")
          ) {
            return;
          }
          throw error;
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
        .then((response) =>
          match(response)
            .with({ status: 200 }, ({ body }) => body)
            .with({ status: P.union(404, 401) }, ({ body }) => {
              throw new Error(JSON.stringify(body));
            })
            .with({ status: 403 }, (response) => {
              throw new Error(response.body.message);
            })
            .otherwise(otherwiseThrow),
        ),
    );
  }

  public requestEstablishmentModification$(siret: SiretDto): Observable<void> {
    return from(
      this.httpClient
        .requestEmailToUpdateFormRoute({
          urlParams: { siret },
        })
        .then((response) =>
          match(response)
            .with({ status: 201 }, () => {
              /* void */
            })
            .with({ status: 400 }, ({ body }) => {
              throw new Error(JSON.stringify(body));
            })
            .otherwise(otherwiseThrow),
        ),
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
        .then((response) =>
          match(response)
            .with({ status: 200 }, () => {
              /* void */
            })
            .with({ status: P.union(400, 401, 403, 409) }, ({ body }) => {
              throw new Error(JSON.stringify(body));
            })
            .otherwise(otherwiseThrow),
        ),
    );
  }
}
