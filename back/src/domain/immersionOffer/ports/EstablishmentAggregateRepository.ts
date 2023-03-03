import { AppellationDto, SearchImmersionResultDto, SiretDto } from "shared";
import {
  DataSource,
  EstablishmentAggregate,
  EstablishmentEntity,
} from "../entities/EstablishmentEntity";
import { ImmersionOfferEntityV2 } from "../entities/ImmersionOfferEntity";
import { SearchMade } from "../entities/SearchMadeEntity";

export type OfferWithSiret = ImmersionOfferEntityV2 & { siret: SiretDto };
export interface EstablishmentAggregateRepository {
  hasEstablishmentFromFormWithSiret: (siret: string) => Promise<boolean>;
  insertEstablishmentAggregates: (
    establishmentAggregates: EstablishmentAggregate[],
  ) => Promise<void>;
  updateEstablishmentAggregate: (
    establishmentAggregate: EstablishmentAggregate,
    updatedAt: Date,
  ) => Promise<void>;
  createImmersionOffersToEstablishments: (
    offersWithSiret: OfferWithSiret[],
  ) => Promise<void>;

  getSearchImmersionResultDtoFromSearchMade: (props: {
    searchMade: SearchMade;
    withContactDetails?: boolean;
    maxResults?: number;
  }) => Promise<SearchImmersionResultDto[]>;

  getActiveEstablishmentSiretsFromLaBonneBoiteNotUpdatedSince: (
    since: Date,
  ) => Promise<SiretDto[]>;

  updateEstablishment: (
    propertiesToUpdate: Partial<EstablishmentEntity> & {
      updatedAt: Date;
      siret: SiretDto;
    },
  ) => Promise<void>;

  removeEstablishmentAndOffersAndContactWithSiret: (
    siret: string,
  ) => Promise<void>;

  getEstablishmentAggregateBySiret: (
    siret: string,
  ) => Promise<EstablishmentAggregate | undefined>;

  getOffersAsAppelationDtoForFormEstablishment: (
    siret: string,
  ) => Promise<AppellationDto[]>;
  getSearchImmersionResultDtoBySiretAndRome: (
    siret: SiretDto,
    rome: string,
  ) => Promise<SearchImmersionResultDto | undefined>;
  getSiretsOfEstablishmentsWithRomeCode: (rome: string) => Promise<SiretDto[]>;
  groupEstablishmentSiretsByDataSource: (
    sirets: SiretDto[],
  ) => Promise<Record<DataSource, SiretDto[]>>;

  markEstablishmentAsSearchableWhenRecentDiscussionAreUnderMaxContactPerWeek: (
    fromDate: Date,
  ) => Promise<number>;
}
