import { type Observable, from } from "rxjs";
import type {
  ConnectedUserJwt,
  EstablishmentRoutes,
  FormEstablishmentDto,
  SiretDto,
} from "shared";
import type { HttpClient } from "shared-routes";
import type { EstablishmentGateway } from "src/core-logic/ports/EstablishmentGateway";
import { P, match } from "ts-pattern";
import {
  logBodyAndThrow,
  otherwiseThrow,
  throwBadRequestWithExplicitMessage,
} from "../otherwiseThrow";

export class HttpEstablishmentGateway implements EstablishmentGateway {
  constructor(private readonly httpClient: HttpClient<EstablishmentRoutes>) {}

  public addFormEstablishment$(
    formEstablishment: FormEstablishmentDto,
    jwt: ConnectedUserJwt,
  ): Observable<void> {
    return from(
      this.httpClient
        .addFormEstablishment({
          body: formEstablishment,
          headers: { authorization: jwt },
        })
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
    jwt: ConnectedUserJwt,
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
            .with({ status: P.union(404, 400, 401, 403) }, ({ body }) => {
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
    jwt: ConnectedUserJwt,
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

  public updateFormEstablishment$(
    formEstablishment: FormEstablishmentDto,
    jwt: ConnectedUserJwt,
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
            .with({ status: 400 }, throwBadRequestWithExplicitMessage)
            .with({ status: P.union(401, 403, 404, 409) }, logBodyAndThrow)
            .otherwise(otherwiseThrow),
        ),
    );
  }
}
