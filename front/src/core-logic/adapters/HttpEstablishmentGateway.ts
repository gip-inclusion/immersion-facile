import axios from "axios";
import { from, Observable } from "rxjs";
import { EstablishmentGateway } from "src/core-logic/ports/EstablishmentGateway";
import { FormEstablishmentDto } from "shared/src/formEstablishment/FormEstablishment.dto";
import {
  formEstablishmentsRoute,
  formAlreadyExistsRoute,
  requestEmailToUpdateFormRoute,
} from "shared/src/routes";
import { SiretDto } from "shared/src/siret";
import { zString } from "shared/src/zodUtils";

const prefix = "api";
export class HttpEstablishmentGateway implements EstablishmentGateway {
  public async addFormEstablishment(
    establishment: FormEstablishmentDto,
  ): Promise<SiretDto> {
    const httpResponse = await axios.post(
      `/${prefix}/${formEstablishmentsRoute}`,
      establishment,
    );

    return zString.parse(httpResponse.data);
  }

  public async isEstablishmentAlreadyRegisteredBySiret(
    siret: SiretDto,
  ): Promise<boolean> {
    const httpResponse = await axios.get(
      `/${prefix}/${formAlreadyExistsRoute}/${siret}`,
    );
    return httpResponse.data;
  }

  public async requestEstablishmentModification(
    siret: SiretDto,
  ): Promise<void> {
    await axios.get(`/${prefix}/${requestEmailToUpdateFormRoute}/${siret}`);
  }

  public requestEstablishmentModificationObservable(
    siret: SiretDto,
  ): Observable<void> {
    return from(this.requestEstablishmentModification(siret));
  }

  public async getFormEstablishmentFromJwt(
    jwt: string,
  ): Promise<FormEstablishmentDto> {
    const httpResponse = await axios.get(
      `/${prefix}/${formEstablishmentsRoute}/${jwt}`,
    );
    return httpResponse.data;
  }

  public async updateFormEstablishment(
    establishment: FormEstablishmentDto,
    jwt: string,
  ): Promise<void> {
    await axios.put(
      `/${prefix}/${formEstablishmentsRoute}/${jwt}`,
      establishment,
    );
  }
}
