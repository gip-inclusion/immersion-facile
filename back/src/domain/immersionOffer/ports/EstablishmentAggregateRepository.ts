import { AppellationDto } from "../../../shared/romeAndAppellationDtos/romeAndAppellation.dto";
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

export interface EstablishmentAggregateRepository {
  hasEstablishmentFromFormWithSiret: (siret: string) => Promise<boolean>;
  getContactEmailFromSiret: (siret: string) => Promise<string | undefined>;
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

  getSearchImmersionResultDtoFromSearchMade: (props: {
    searchMade: SearchMade;
    withContactDetails?: boolean;
    maxResults?: number;
  }) => Promise<SearchImmersionResultDto[]>;

  getActiveEstablishmentSiretsFromLaBonneBoiteNotUpdatedSince: (
    since: Date,
  ) => Promise<string[]>;

  getSiretOfEstablishmentsFromFormSource: () => Promise<string[]>;

  updateEstablishment: (
    siret: string,
    propertiesToUpdate: Partial<
      Pick<
        EstablishmentEntityV2,
        "address" | "position" | "nafDto" | "numberEmployeesRange" | "isActive"
      >
    > & { updatedAt: Date },
  ) => Promise<void>;

  removeEstablishmentAndOffersAndContactWithSiret: (
    siret: string,
  ) => Promise<void>;

  getEstablishmentForSiret: (
    siret: string,
  ) => Promise<EstablishmentEntityV2 | undefined>;
  getContactForEstablishmentSiret: (
    siret: string,
  ) => Promise<ContactEntityV2 | undefined>;
  getOffersAsAppelationDtoForFormEstablishment: (
    siret: string,
  ) => Promise<AppellationDto[]>;
}
