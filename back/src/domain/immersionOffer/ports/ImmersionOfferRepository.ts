import { EstablishmentEntity } from "../entities/EstablishmentEntity";
import {
  ImmersionOfferEntity,
  ImmersionEstablishmentContact,
} from "../entities/ImmersionOfferEntity";

export type SearchParams = {
  rome: string;
  distance: number;
  lat: number;
  lon: number;
  nafDivision?: string;
};

export interface ImmersionOfferRepository {
  insertEstablishmentContact: (
    establishmentContact: ImmersionEstablishmentContact,
  ) => Promise<void>;
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
