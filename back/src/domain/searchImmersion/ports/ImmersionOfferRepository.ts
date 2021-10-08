import { ImmersionOfferEntity } from "../entities/ImmersionOfferEntity";

export type SearchParams = {
  ROME: string;
  distance: number;
  lat: number;
  lon: number;
};

export interface ImmersionOfferRepository {
  insertSearch: (searchParams: SearchParams) => Promise<void>;
  getAll(): Promise<ImmersionOfferEntity[]>;
  getFromSearch(
    rome: string,
    localisation: [number, number],
  ): Promise<ImmersionOfferEntity[]>;
}
