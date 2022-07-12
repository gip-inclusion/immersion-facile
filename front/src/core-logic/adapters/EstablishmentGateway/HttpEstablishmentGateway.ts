import axios from "axios";
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
import { validateDataFromSchema } from "shared/src/zodUtils";
import { formEstablishmentSchema } from "shared/src/formEstablishment/FormEstablishment.schema";

const prefix = "api";
export class HttpEstablishmentGateway implements EstablishmentGateway {
  public async addFormEstablishment(
    establishment: FormEstablishmentDto,
  ): Promise<SiretDto> {
    const { data } = await axios.post<unknown>(
      `/${prefix}/${formEstablishmentsRoute}`,
      establishment,
    );
    const siretDto = validateDataFromSchema(siretSchema, data);
    if (siretDto instanceof Error) throw siretDto;
    return siretDto;
  }

  public async isEstablishmentAlreadyRegisteredBySiret(
    siret: SiretDto,
  ): Promise<boolean> {
    const { data } = await axios.get<unknown>(
      `/${prefix}/${formAlreadyExistsRoute}/${siret}`,
    );
    const isSiretExistResponse = validateDataFromSchema(
      isSiretExistResponseSchema,
      data,
    );
    if (isSiretExistResponse instanceof Error) throw isSiretExistResponse;
    return isSiretExistResponse;
  }

  public async requestEstablishmentModification(
    siret: SiretDto,
  ): Promise<void> {
    await axios.post(`/${prefix}/${requestEmailToUpdateFormRoute}/${siret}`);
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
    const { data } = await axios.get(
      `/${prefix}/${formEstablishmentsRoute}/${siret}`,
      {
        headers: {
          Authorization: jwt,
        },
      },
    );
    const formEstablishmentDto = validateDataFromSchema(
      formEstablishmentSchema,
      data,
    );
    if (formEstablishmentDto instanceof Error) throw formEstablishmentDto;
    return formEstablishmentDto;
  }

  public async updateFormEstablishment(
    establishment: FormEstablishmentDto,
    jwt: string,
  ): Promise<void> {
    await axios.put(`/${prefix}/${formEstablishmentsRoute}`, establishment, {
      headers: {
        Authorization: jwt,
      },
    });
  }
}
