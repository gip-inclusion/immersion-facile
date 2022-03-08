import axios from "axios";
import { FormEstablishmentGateway } from "src/core-logic/ports/FormEstablishmentGateway";
import { FormEstablishmentDto } from "src/shared/FormEstablishmentDto";
import { RomeSearchMatchDto, romeSearchResponseSchema } from "src/shared/rome";
import {
  formAlreadyExistsRoute,
  immersionOffersFromFrontRoute,
  requestEmailToUpdateFormRoute,
  romeRoute,
} from "src/shared/routes";
import { SiretDto } from "src/shared/siret";
import { zString } from "src/shared/zodUtils";

const prefix = "api";

export class HttpFormEstablishmentGateway implements FormEstablishmentGateway {
  public async addFormEstablishment(
    establishment: FormEstablishmentDto,
  ): Promise<SiretDto> {
    const httpResponse = await axios.post(
      `/${prefix}/${immersionOffersFromFrontRoute}`,
      establishment,
    );

    return zString.parse(httpResponse.data);
  }

  public async searchProfession(
    searchText: string,
  ): Promise<RomeSearchMatchDto[]> {
    const httpResponse = await axios.get(`/${prefix}/${romeRoute}`, {
      params: { searchText },
    });

    return romeSearchResponseSchema.parse(httpResponse.data);
  }
  public async getSiretAlreadyExists(siret: SiretDto): Promise<boolean> {
    const httpResponse = await axios.get(
      `/${prefix}/${formAlreadyExistsRoute}/${siret}`,
    );
    return httpResponse.data;
  }
  public async requestEmailToEditForm(siret: SiretDto): Promise<void> {
    await axios.get(`/${prefix}/${requestEmailToUpdateFormRoute}/${siret}`);
  }
}
