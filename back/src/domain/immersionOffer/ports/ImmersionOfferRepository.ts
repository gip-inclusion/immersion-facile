import { SearchImmersionResultDto } from "../../../shared/SearchImmersionDto";
import { EstablishmentAggregate } from "../entities/EstablishmentAggregate";
import { EstablishmentEntity } from "../entities/EstablishmentEntity";
import {
  ImmersionEstablishmentContact,
  ImmersionOfferEntity,
} from "../entities/ImmersionOfferEntity";
import { SearchParams } from "../entities/SearchParams";

export interface ImmersionOfferRepository {
  insertEstablishmentAggregates: (
    establishments: EstablishmentAggregate[],
  ) => Promise<void>;

  // DEPRECATED.

  insertEstablishmentContact: (
    establishmentContact: ImmersionEstablishmentContact,
  ) => Promise<void>;
  insertImmersions: (immersions: ImmersionOfferEntity[]) => Promise<void>;
  insertEstablishments: (
    establishments: EstablishmentEntity[],
  ) => Promise<void>;

  getImmersionFromUuid(
    uuid: string,
    withContactDetails?: boolean,
  ): Promise<SearchImmersionResultDto | undefined>;
  getFromSearch: (
    searchParams: SearchParams,
    withContactDetails?: boolean,
  ) => Promise<SearchImmersionResultDto[]>;
}
