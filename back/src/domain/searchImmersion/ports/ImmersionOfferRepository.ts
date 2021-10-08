import { ImmersionOfferEntity } from "../entities/ImmersionOfferEntity";
import { QueryResult } from "pg";

export type SearchParams = {
  ROME: string;
  distance: number;
  lat: number;
  lon: number;
};

export interface ImmersionOfferRepository {
  insertSearch: (searchParams: SearchParams) => Promise<void>;
  insertImmersions: (immersions: ImmersionOfferEntity[]) => Promise<void>;

  getAll: () => Promise<ImmersionOfferEntity[]>;
  getSearchesMadeAndNotInserted(): Promise<SearchParams[]>;
  getFromSearch: (
    rome: string,
    localisation: [number, number],
  ) => Promise<ImmersionOfferEntity[]>;
}
