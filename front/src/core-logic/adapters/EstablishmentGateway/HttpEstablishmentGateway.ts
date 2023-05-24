import { from, Observable } from "rxjs";
import { EstablishmentTargets, FormEstablishmentDto, SiretDto } from "shared";
import { HttpClient } from "http-client";
import { EstablishmentGateway } from "src/core-logic/ports/EstablishmentGateway";

export class HttpEstablishmentGateway implements EstablishmentGateway {
  constructor(private readonly httpClient: HttpClient<EstablishmentTargets>) {}

  public async addFormEstablishment(
    establishment: FormEstablishmentDto,
  ): Promise<void> {
    await this.httpClient.addFormEstablishment({
      body: establishment,
    });
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
    establishment: FormEstablishmentDto,
    jwt: string,
  ): Promise<void> {
    await this.httpClient.updateFormEstablishment({
      body: establishment,
      headers: {
        authorization: jwt,
      },
    });
  }
}
