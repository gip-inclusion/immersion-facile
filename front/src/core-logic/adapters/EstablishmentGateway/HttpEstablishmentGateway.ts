import { from, Observable } from "rxjs";
import { EstablishmentTargets, FormEstablishmentDto, SiretDto } from "shared";
import { HttpClient } from "http-client";
import { EstablishmentGateway } from "src/core-logic/ports/EstablishmentGateway";

export class HttpEstablishmentGateway implements EstablishmentGateway {
  constructor(private readonly httpClient: HttpClient<EstablishmentTargets>) {}

  public async addFormEstablishment(
    formEstablishment: FormEstablishmentDto,
  ): Promise<void> {
    await this.httpClient.addFormEstablishment({
      body: formEstablishment,
    });
  }

  public addFormEstablishment$(
    formEstablishment: FormEstablishmentDto,
  ): Observable<void> {
    return from(this.addFormEstablishment(formEstablishment));
  }

  public getFormEstablishmentFromJwt$(
    siret: SiretDto,
    jwt: string,
  ): Observable<FormEstablishmentDto> {
    console.log("getFormEstablishmentFromJwt$", jwt);
    return from(this.getFormEstablishmentFromJwt(siret, jwt));
  }

  public async requestEstablishmentModification(
    siret: SiretDto,
  ): Promise<void> {
    await this.httpClient.requestEmailToUpdateFormRoute({
      urlParams: { siret },
    });
  }

  public requestEstablishmentModification$(siret: SiretDto): Observable<void> {
    return from(this.requestEstablishmentModification(siret));
  }

  public async getFormEstablishmentFromJwt(
    siret: SiretDto,
    jwt: string,
  ): Promise<FormEstablishmentDto> {
    const { responseBody } = await this.httpClient.getFormEstablishment({
      urlParams: { siret },
      headers: { authorization: jwt },
    });
    return responseBody;
  }

  public async updateFormEstablishment(
    formEstablishment: FormEstablishmentDto,
    jwt: string,
  ): Promise<void> {
    await this.httpClient.updateFormEstablishment({
      body: formEstablishment,
      headers: {
        authorization: jwt,
      },
    });
  }

  public updateFormEstablishment$(
    formEstablishment: FormEstablishmentDto,
    jwt: string,
  ): Observable<void> {
    return from(this.updateFormEstablishment(formEstablishment, jwt));
  }
}
