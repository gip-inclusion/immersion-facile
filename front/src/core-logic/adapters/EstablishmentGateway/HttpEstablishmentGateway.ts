import { from, Observable } from "rxjs";
import {
  EstablishmentJwt,
  EstablishmentTargets,
  FormEstablishmentDto,
  SiretDto,
} from "shared";
import { HttpClient } from "http-client";
import { EstablishmentGateway } from "src/core-logic/ports/EstablishmentGateway";

export class HttpEstablishmentGateway implements EstablishmentGateway {
  constructor(private readonly httpClient: HttpClient<EstablishmentTargets>) {}

  public getFormEstablishmentFromJwt$(
    siret: SiretDto,
    jwt: string,
  ): Observable<FormEstablishmentDto> {
    return from(this.getFormEstablishmentFromJwt(siret, jwt));
  }

  public addFormEstablishment$(
    formEstablishment: FormEstablishmentDto,
  ): Observable<void> {
    return from(this.addFormEstablishment(formEstablishment));
  }

  public requestEstablishmentModification$(siret: SiretDto): Observable<void> {
    return from(this.requestEstablishmentModification(siret));
  }

  public updateFormEstablishment$(
    formEstablishment: FormEstablishmentDto,
    jwt: EstablishmentJwt,
  ): Observable<void> {
    return from(this.updateFormEstablishment(formEstablishment, jwt));
  }

  private async addFormEstablishment(
    formEstablishment: FormEstablishmentDto,
  ): Promise<void> {
    await this.httpClient.addFormEstablishment({
      body: formEstablishment,
    });
  }

  private async requestEstablishmentModification(
    siret: SiretDto,
  ): Promise<void> {
    await this.httpClient.requestEmailToUpdateFormRoute({
      urlParams: { siret },
    });
  }

  private async getFormEstablishmentFromJwt(
    siret: SiretDto,
    jwt: EstablishmentJwt,
  ): Promise<FormEstablishmentDto> {
    const { responseBody } = await this.httpClient.getFormEstablishment({
      urlParams: { siret },
      headers: { authorization: jwt },
    });
    return responseBody;
  }

  private async updateFormEstablishment(
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
