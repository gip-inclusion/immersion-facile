import axios from "axios";
import { FormEstablishmentGateway } from "src/core-logic/ports/FormEstablishmentGateway";
import {
  AddFormEstablishmentResponseDto,
  FormEstablishmentDto,
  FormEstablishmentId,
  addFormEstablishmentResponseSchema,
} from "src/shared/FormEstablishmentDto";
import {
  RomeSearchResponseDto,
  romeSearchResponseSchema,
} from "src/shared/rome";
import { immersionOffersRoute, romeRoute } from "src/shared/routes";

const prefix = "api";

export class HttpFormEstablishmentGateway implements FormEstablishmentGateway {
  public async addFormEstablishment(
    establishment: FormEstablishmentDto,
  ): Promise<FormEstablishmentId> {
    const httpResponse = await axios.post(
      `/${prefix}/${immersionOffersRoute}`,
      establishment,
    );
    const responseDto: AddFormEstablishmentResponseDto = httpResponse.data;
    addFormEstablishmentResponseSchema.parse(responseDto);
    return responseDto;
  }

  public async searchProfession(
    searchText: string,
  ): Promise<RomeSearchResponseDto> {
    const httpResponse = await axios.get(`/${prefix}/${romeRoute}`, {
      params: { searchText },
    });
    const responseDto: RomeSearchResponseDto = httpResponse.data;
    romeSearchResponseSchema.parse(responseDto);
    return responseDto;
  }
}
