import axios from "axios";
import { ImmersionOfferGateway } from "src/core-logic/ports/ImmersionOfferGateway";
import {
  AddImmersionOfferResponseDto,
  ImmersionOfferDto,
  ImmersionOfferId,
} from "src/shared/ImmersionOfferDto";
import {
  RomeSearchResponseDto,
  romeSearchResponseSchema,
} from "src/shared/rome";
import { immersionOffersRoute, romeRoute } from "src/shared/routes";
import { addImmersionOfferResponseSchema } from "./../../shared/ImmersionOfferDto";

const prefix = "api";

export class HttpImmersionOfferGateway implements ImmersionOfferGateway {
  public async addImmersionOffer(
    immersionOffer: ImmersionOfferDto,
  ): Promise<ImmersionOfferId> {
    const httpResponse = await axios.post(
      `/${prefix}/${immersionOffersRoute}`,
      immersionOffer,
    );
    const responseDto: AddImmersionOfferResponseDto = httpResponse.data;
    addImmersionOfferResponseSchema.parse(responseDto);
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
