import {
  ImmersionOfferId,
  SearchImmersionResultDto,
} from "../../../shared/SearchImmersionDto";
import { ContactEntityV2 } from "../entities/ContactEntity";
import {
  AnnotatedEstablishmentEntityV2,
  EstablishmentAggregate,
  EstablishmentEntityV2,
} from "../entities/EstablishmentEntity";
import { AnnotatedImmersionOfferEntityV2 } from "../entities/ImmersionOfferEntity";
import { SearchMade } from "../entities/SearchMadeEntity";

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
    searchMade: SearchMade,
    withContactDetails?: boolean,
  ) => Promise<SearchImmersionResultDto[]>;

  getActiveEstablishmentSiretsNotUpdatedSince: (
    since: Date,
  ) => Promise<string[]>;

  updateEstablishment: (
    siret: string,
    propertiesToUpdate: Partial<
      Pick<
        EstablishmentEntityV2,
        "address" | "position" | "naf" | "numberEmployeesRange" | "isActive"
      >
    > & { updatedAt: Date },
  ) => Promise<void>;
}
