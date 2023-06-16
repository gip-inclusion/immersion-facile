import { AppellationDto, SearchImmersionResultDto, SiretDto } from "shared";
import {
  EstablishmentAggregate,
  EstablishmentEntity,
} from "../entities/EstablishmentEntity";
import { ImmersionOfferEntityV2 } from "../entities/ImmersionOfferEntity";
import { SearchMade } from "../entities/SearchMadeEntity";

export type OfferWithSiret = ImmersionOfferEntityV2 & { siret: SiretDto };
export interface EstablishmentAggregateRepository {
  hasEstablishmentWithSiret: (siret: string) => Promise<boolean>;
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

  getOffersAsAppellationDtoEstablishment: (
    siret: string,
  ) => Promise<AppellationDto[]>;
  getSearchImmersionResultDtoBySiretAndRome: (
    siret: SiretDto,
    rome: string,
  ) => Promise<SearchImmersionResultDto | undefined>;
  getSiretsOfEstablishmentsWithRomeCode: (rome: string) => Promise<SiretDto[]>;

  markEstablishmentAsSearchableWhenRecentDiscussionAreUnderMaxContactPerWeek: (
    fromDate: Date,
  ) => Promise<number>;

  getSiretOfEstablishmentsToSuggestUpdate: (
    before: Date,
  ) => Promise<SiretDto[]>;

  getSiretsOfEstablishmentsNotCheckedAtInseeSince: (
    checkDate: Date,
    maxResults: number,
  ) => Promise<SiretDto[]>;

  updateEstablishmentsWithInseeData: (
    inseeCheckDate: Date,
    params: UpdateEstablishmentsWithInseeDataParams,
  ) => Promise<void>;
}

// export type ValuesToUpdateFromInseeApi = Partial<
//   Pick<
//     SiretEstablishmentDto,
//     "nafDto" | "numberEmployeesRange" | "businessName" | "isOpen"
//   >
// >;

export type ValuesToUpdateFromInseeApi = Partial<
  Pick<
    EstablishmentEntity,
    "name" | "numberEmployeesRange" | "isActive" | "nafDto"
  >
>;

export type UpdateEstablishmentsWithInseeDataParams = Record<
  SiretDto,
  ValuesToUpdateFromInseeApi
>;
