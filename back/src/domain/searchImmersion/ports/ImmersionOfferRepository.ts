import { ImmersionOfferEntity } from "../entities/ImmersionOfferEntity";

export interface ImmersionOfferRepository {
  getAll(): Promise<ImmersionOfferEntity[]>;
  getFromSearch(
    rome: string,
    localisation: [number, number]
  ): Promise<ImmersionOfferEntity[]>;
}
