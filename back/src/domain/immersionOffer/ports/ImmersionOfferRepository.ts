import {
  ImmersionOfferId,
  SearchImmersionResultDto,
} from "../../../shared/SearchImmersionDto";
import {
  EstablishmentAggregate,
  EstablishmentEntityV2,
} from "../entities/EstablishmentAggregate";
import { EstablishmentEntity } from "../entities/EstablishmentEntity";
import {
  ContactEntityV2,
  ImmersionEstablishmentContact,
  ImmersionOfferEntity,
  ImmersionOfferEntityV2,
} from "../entities/ImmersionOfferEntity";
import { SearchParams } from "../entities/SearchParams";

export interface ImmersionOfferRepository {
  insertEstablishmentAggregates: (
    establishments: EstablishmentAggregate[],
  ) => Promise<void>;

  getEstablishmentByImmersionOfferId: (
    immersionOfferId: ImmersionOfferId,
  ) => Promise<EstablishmentEntityV2 | undefined>;

  getContactByImmersionOfferId: (
    immersionOfferId: ImmersionOfferId,
  ) => Promise<ContactEntityV2 | undefined>;

  getImmersionOfferById: (
    immersionOfferId: ImmersionOfferId,
  ) => Promise<ImmersionOfferEntityV2 | undefined>;

  // DEPRECATED.
  insertEstablishmentContact: (
    establishmentContact: ImmersionEstablishmentContact,
  ) => Promise<void>;
  insertImmersions: (immersions: ImmersionOfferEntity[]) => Promise<void>;
  insertEstablishments: (
    establishments: EstablishmentEntity[],
  ) => Promise<void>;

  getFromSearch: (
    searchParams: SearchParams,
    withContactDetails?: boolean,
  ) => Promise<SearchImmersionResultDto[]>;
}
