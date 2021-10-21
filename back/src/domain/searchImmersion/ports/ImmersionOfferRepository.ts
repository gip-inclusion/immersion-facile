import { ImmersionOfferEntity } from "../entities/ImmersionOfferEntity";
import { QueryResult } from "pg";
import { EstablishmentEntity } from "../entities/EstablishmentEntity";

export type SearchParams = {
  ROME: string;
  distance: number;
  lat: number;
  lon: number;
  nafDivision?: string;
};

export interface ImmersionOfferRepository {
  insertSearch: (searchParams: SearchParams) => Promise<void>;
  insertImmersions: (immersions: ImmersionOfferEntity[]) => Promise<void>;
  insertEstablishments: (
    establishments: EstablishmentEntity[],
  ) => Promise<void>;
  markPendingResearchesAsProcessedAndRetrieveThem(): Promise<SearchParams[]>;

  getFromSearch: (
    searchParams: SearchParams,
  ) => Promise<ImmersionOfferEntity[]>;
}
