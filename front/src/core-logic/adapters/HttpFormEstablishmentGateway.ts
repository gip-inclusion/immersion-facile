import axios from "axios";
import { FormEstablishmentGateway } from "src/core-logic/ports/FormEstablishmentGateway";
import {
  FormEstablishmentDto,
  FormEstablishmentId,
  formEstablishmentIdSchema,
} from "src/shared/FormEstablishmentDto";
import { RomeSearchMatchDto, romeSearchResponseSchema } from "src/shared/rome";
import {
  formAlreadyExistsRoute,
  immersionOffersRoute,
  requestEmailToUpdateFormRoute,
  romeRoute,
} from "src/shared/routes";

const prefix = "api";

export class HttpFormEstablishmentGateway implements FormEstablishmentGateway {
  public async addFormEstablishment(
    establishment: FormEstablishmentDto,
  ): Promise<FormEstablishmentId> {
    const httpResponse = await axios.post(
      `/${prefix}/${immersionOffersRoute}`,
      establishment,
    );

    return formEstablishmentIdSchema.parse(httpResponse.data);
  }

  public async searchProfession(
    searchText: string,
  ): Promise<RomeSearchMatchDto[]> {
    const httpResponse = await axios.get(`/${prefix}/${romeRoute}`, {
      params: { searchText },
    });

    return romeSearchResponseSchema.parse(httpResponse.data);
  }
  public async getSiretAlreadyExists(siret: string): Promise<boolean> {
    const httpResponse = await axios.get(
      `/${prefix}/${formAlreadyExistsRoute}/${siret}`,
    );
    return httpResponse.data;
  }
  public async requestEmailToEditForm(siret: string): Promise<void> {
    await axios.get(`/${prefix}/${requestEmailToUpdateFormRoute}/${siret}`);
  }
}
