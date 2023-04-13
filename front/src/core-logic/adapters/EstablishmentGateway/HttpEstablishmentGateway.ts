import { from, Observable } from "rxjs";
import {
  EstablishmentTargets,
  FormEstablishmentDto,
  isSiretExistResponseSchema,
  SiretDto,
  siretSchema,
} from "shared";
import { HttpClient } from "http-client";
import { EstablishmentGateway } from "src/core-logic/ports/EstablishmentGateway";

export class HttpEstablishmentGateway implements EstablishmentGateway {
  constructor(private readonly httpClient: HttpClient<EstablishmentTargets>) {}

  public async addFormEstablishment(
    establishment: FormEstablishmentDto,
  ): Promise<SiretDto> {
    const response = await this.httpClient.addFormEstablishment({
      body: establishment,
    });
    return siretSchema.parse(response.responseBody);
  }

  public async isEstablishmentAlreadyRegisteredBySiret(
    siret: SiretDto,
  ): Promise<boolean> {
    const response =
      await this.httpClient.isEstablishmentWithSiretAlreadyRegistered({
        urlParams: { siret },
      });
    return isSiretExistResponseSchema.parse(response.responseBody);
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
