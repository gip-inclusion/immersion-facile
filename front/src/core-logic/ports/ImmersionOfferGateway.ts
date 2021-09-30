import {
  ImmersionOfferDto,
  ImmersionOfferId,
} from "src/shared/ImmersionOfferDto";
import { RomeSearchResponseDto } from "src/shared/rome";

export interface ImmersionOfferGateway {
  addImmersionOffer: (
    immersionOffer: ImmersionOfferDto,
  ) => Promise<ImmersionOfferId>;
  searchProfession: (searchText: string) => Promise<RomeSearchResponseDto>;
}
