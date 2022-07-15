import { AxiosInstance } from "axios";
import { from, Observable } from "rxjs";
import { EstablishmentGateway } from "src/core-logic/ports/EstablishmentGateway";
import { FormEstablishmentDto } from "shared/src/formEstablishment/FormEstablishment.dto";
import {
  formEstablishmentsRoute,
  formAlreadyExistsRoute,
  requestEmailToUpdateFormRoute,
} from "shared/src/routes";
import {
  isSiretExistResponseSchema,
  SiretDto,
  siretSchema,
} from "shared/src/siret";
import { formEstablishmentSchema } from "shared/src/formEstablishment/FormEstablishment.schema";

export class HttpEstablishmentGateway implements EstablishmentGateway {
  constructor(private readonly httpClient: AxiosInstance) {}

  public async addFormEstablishment(
    establishment: FormEstablishmentDto,
  ): Promise<SiretDto> {
    const { data } = await this.httpClient.post<unknown>(
      `/${formEstablishmentsRoute}`,
      establishment,
    );
    const siretDto = siretSchema.parse(data);
    return siretDto;
  }

  public async isEstablishmentAlreadyRegisteredBySiret(
    siret: SiretDto,
  ): Promise<boolean> {
    const { data } = await this.httpClient.get<unknown>(
      `/${formAlreadyExistsRoute}/${siret}`,
    );
    const isSiretExistResponse = isSiretExistResponseSchema.parse(data);
    return isSiretExistResponse;
  }

  public async requestEstablishmentModification(
    siret: SiretDto,
  ): Promise<void> {
    await this.httpClient.post(`/${requestEmailToUpdateFormRoute}/${siret}`);
  }

  public requestEstablishmentModificationObservable(
    siret: SiretDto,
  ): Observable<void> {
    return from(this.requestEstablishmentModification(siret));
  }

  public async getFormEstablishmentFromJwt(
    siret: SiretDto,
    jwt: string,
  ): Promise<FormEstablishmentDto> {
    const { data } = await this.httpClient.get(
      `/${formEstablishmentsRoute}/${siret}`,
      {
        headers: {
          Authorization: jwt,
        },
      },
    );
    const formEstablishmentDto = formEstablishmentSchema.parse(data);
    return formEstablishmentDto;
  }

  public async updateFormEstablishment(
    establishment: FormEstablishmentDto,
    jwt: string,
  ): Promise<void> {
    await this.httpClient.put(`/${formEstablishmentsRoute}`, establishment, {
      headers: {
        Authorization: jwt,
      },
    });
  }
}
