import {
  AppellationAndRomeDto,
  AppellationCode,
  SearchImmersionResultDto,
  SiretDto,
} from "shared";
import {
  EstablishmentAggregate,
  EstablishmentEntity,
} from "../entities/EstablishmentEntity";
import { ImmersionOfferEntityV2 } from "../entities/ImmersionOfferEntity";
import { SearchMade } from "../entities/SearchMadeEntity";

export type OfferWithSiret = ImmersionOfferEntityV2 & { siret: SiretDto };
export type SearchImmersionResult = SearchImmersionResultDto & {
  isSearchable: boolean;
};

export type SearchImmersionParams = {
  searchMade: SearchMade;
  maxResults?: number;
};

export interface EstablishmentAggregateRepository {
  delete: (siret: SiretDto) => Promise<void>;
  insertEstablishmentAggregates: (
    establishmentAggregates: EstablishmentAggregate[],
  ) => Promise<void>;

  updateEstablishmentAggregate: (
    establishmentAggregate: EstablishmentAggregate,
    updatedAt: Date,
  ) => Promise<void>;

  updateEstablishment: (
    propertiesToUpdate: Partial<EstablishmentEntity> & {
      updatedAt: Date;
      siret: SiretDto;
    },
  ) => Promise<void>;

  removeEstablishmentAndOffersAndContactWithSiret: (
    siret: string,
  ) => Promise<void>;

  markEstablishmentAsSearchableWhenRecentDiscussionAreUnderMaxContactPerWeek: (
    fromDate: Date,
  ) => Promise<number>;

  updateEstablishmentsWithInseeData: (
    inseeCheckDate: Date,
    params: UpdateEstablishmentsWithInseeDataParams,
  ) => Promise<void>;

  hasEstablishmentWithSiret: (siret: string) => Promise<boolean>;

  getEstablishmentAggregateBySiret: (
    siret: string,
  ) => Promise<EstablishmentAggregate | undefined>;

  getOffersAsAppellationDtoEstablishment: (
    siret: string,
  ) => Promise<AppellationAndRomeDto[]>;

  getSearchImmersionResultDtoBySiretAndAppellationCode: (
    siret: SiretDto,
    appellationCode: AppellationCode,
  ) => Promise<SearchImmersionResultDto | undefined>;

  getSiretsOfEstablishmentsWithRomeCode: (rome: string) => Promise<SiretDto[]>;

  getSiretOfEstablishmentsToSuggestUpdate: (
    before: Date,
  ) => Promise<SiretDto[]>;

  getSiretsOfEstablishmentsNotCheckedAtInseeSince: (
    checkDate: Date,
    maxResults: number,
  ) => Promise<SiretDto[]>;

  getSearchImmersionResultDtoBySiretAndRome: (
    siret: SiretDto,
    rome: string,
  ) => Promise<SearchImmersionResultDto | undefined>;

  searchImmersionResults: (
    searchImmersionParams: SearchImmersionParams,
  ) => Promise<SearchImmersionResult[]>;
}

export type ValuesToUpdateFromInseeApi = Partial<
  Pick<
    EstablishmentEntity,
    "name" | "numberEmployeesRange" | "isOpen" | "nafDto"
  >
>;

export type UpdateEstablishmentsWithInseeDataParams = Partial<
  Record<SiretDto, ValuesToUpdateFromInseeApi>
>;

export const establishmentNotFoundErrorMessage = (siret: SiretDto): string =>
  `Establishment with siret ${siret} not found`;
