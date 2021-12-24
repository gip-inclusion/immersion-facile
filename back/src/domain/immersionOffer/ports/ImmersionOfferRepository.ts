import {
  ImmersionOfferId,
  SearchImmersionResultDto,
} from "../../../shared/SearchImmersionDto";
import { ContactEntityV2 } from "../entities/ContactEntity";
import {
  AnnotatedEstablishmentEntityV2,
  EstablishmentAggregate,
} from "../entities/EstablishmentEntity";
import { AnnotatedImmersionOfferEntityV2 } from "../entities/ImmersionOfferEntity";
import { SearchParams } from "../entities/SearchParams";

export interface ImmersionOfferRepository {
  insertEstablishmentAggregates: (
    establishments: EstablishmentAggregate[],
  ) => Promise<void>;

  getAnnotatedEstablishmentByImmersionOfferId: (
    immersionOfferId: ImmersionOfferId,
  ) => Promise<AnnotatedEstablishmentEntityV2 | undefined>;

  getAnnotatedImmersionOfferById: (
    immersionOfferId: ImmersionOfferId,
  ) => Promise<AnnotatedImmersionOfferEntityV2 | undefined>;

  getContactByImmersionOfferId: (
    immersionOfferId: ImmersionOfferId,
  ) => Promise<ContactEntityV2 | undefined>;

  getFromSearch: (
    searchParams: SearchParams,
    withContactDetails?: boolean,
  ) => Promise<SearchImmersionResultDto[]>;
}
