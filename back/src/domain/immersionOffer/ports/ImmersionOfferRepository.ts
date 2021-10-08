import {
  ImmersionOfferId,
  ImmersionOfferDto,
} from "../../../shared/ImmersionOfferDto";

export interface ImmersionOfferRepository {
  save: (
    immersionOfferDto: ImmersionOfferDto,
  ) => Promise<ImmersionOfferId | undefined>;

  getById: (id: ImmersionOfferId) => Promise<ImmersionOfferDto | undefined>;
  getAll: () => Promise<ImmersionOfferDto[]>;
}
