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
    return from(this.#addFormEstablishment(formEstablishment));
  }

  public deleteEstablishment$(
    siret: SiretDto,
    jwt: BackOfficeJwt,
  ): Observable<void> {
    return from(this.#deleteEstablishment(siret, jwt));
  }

  public getFormEstablishmentFromJwt$(
    siret: SiretDto,
    jwt: EstablishmentJwt | BackOfficeJwt,
  ): Observable<FormEstablishmentDto> {
    return from(this.#getFormEstablishmentFromJwt(siret, jwt));
  }

  public requestEstablishmentModification$(siret: SiretDto): Observable<void> {
    return from(this.#requestEstablishmentModification(siret));
  }

  public updateFormEstablishment$(
    formEstablishment: FormEstablishmentDto,
    jwt: EstablishmentJwt,
  ): Observable<void> {
    return from(this.#updateFormEstablishment(formEstablishment, jwt));
  }

  async #addFormEstablishment(
    formEstablishment: FormEstablishmentDto,
  ): Promise<void> {
    await this.httpClient.addFormEstablishment({
      body: formEstablishment,
    });
  }

  async #deleteEstablishment(
    siret: SiretDto,
    jwt: EstablishmentJwt | BackOfficeJwt,
  ): Promise<void> {
    await this.httpClient.deleteEstablishment({
      urlParams: { siret },
      headers: { authorization: jwt },
    });
  }

  async #getFormEstablishmentFromJwt(
    siret: SiretDto,
    jwt: EstablishmentJwt | BackOfficeJwt,
  ): Promise<FormEstablishmentDto> {
    return (
      await this.httpClient.getFormEstablishment({
        urlParams: { siret },
        headers: { authorization: jwt },
      })
    ).responseBody;
  }

  async #requestEstablishmentModification(siret: SiretDto): Promise<void> {
    await this.httpClient.requestEmailToUpdateFormRoute({
      urlParams: { siret },
    });
  }

  async #updateFormEstablishment(
    formEstablishment: FormEstablishmentDto,
    jwt: EstablishmentJwt,
  ): Promise<void> {
    await this.httpClient.updateFormEstablishment({
      body: formEstablishment,
      headers: {
        authorization: jwt,
      },
    });
  }
}
