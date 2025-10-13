import type {
  AppellationAndRomeDto,
  AppellationCode,
  DataWithPagination,
  DateTimeIsoString,
  EstablishmentSearchableByValue,
  LocationId,
  NafCode,
  SearchResultDto,
  SearchSortedBy,
  SiretDto,
  UserId,
  WithRequiredPagination,
  WithSort,
} from "shared";
import type { EstablishmentAggregate } from "../entities/EstablishmentAggregate";
import type { EstablishmentEntity } from "../entities/EstablishmentEntity";
import type { OfferEntity } from "../entities/OfferEntity";
import type { GeoParams, SearchMade } from "../entities/SearchMadeEntity";

export type RepositorySearchResultDto = Omit<SearchResultDto, "urlOfPartner">;
export type RepositorySearchImmertionResult = Omit<
  SearchImmersionResult,
  "urlOfPartner"
>;
export type OfferWithSiret = OfferEntity & { siret: SiretDto };
export type SearchImmersionResult = SearchResultDto & {
  isSearchable: boolean;
  nextAvailabilityDate?: DateTimeIsoString;
};

export type LegacySearchImmersionParams = {
  searchMade: SearchMade;
  fitForDisabledWorkers?: boolean;
  maxResults?: number;
};

type GetOffersFilters = {
  appellationCodes?: AppellationCode[];
  fitForDisabledWorkers?: boolean; // if not defined -> return all
  geoParams?: GeoParams;
  locationIds?: LocationId[];
  nafCodes?: NafCode[];
  searchableBy?: EstablishmentSearchableByValue; // if not defined -> return all
  sirets?: SiretDto[];
};

export type GetOffersParams = WithRequiredPagination &
  WithSort<SearchSortedBy> & {
    filters: GetOffersFilters;
  };

export type EstablishmentAggregateFilters = { userId: UserId };

export interface EstablishmentAggregateRepository {
  //Establishment aggregate
  delete(siret: SiretDto): Promise<void>;
  insertEstablishmentAggregate(
    establishmentAggregate: EstablishmentAggregate,
  ): Promise<void>;
  updateEstablishmentAggregate(
    establishmentAggregate: EstablishmentAggregate,
    updatedAt: Date, // Pas utilisé dans l'InMemory > Side effects PG pas testés dans la business logic
  ): Promise<void>;
  getEstablishmentAggregateBySiret(
    siret: SiretDto,
  ): Promise<EstablishmentAggregate | undefined>;
  getEstablishmentAggregatesByFilters(
    params: EstablishmentAggregateFilters,
  ): Promise<EstablishmentAggregate[]>;
  hasEstablishmentAggregateWithSiret(siret: string): Promise<boolean>;
  updateEstablishmentsWithInseeData(
    inseeCheckDate: Date,
    params: UpdateEstablishmentsWithInseeDataParams,
  ): Promise<void>;
  markEstablishmentAsSearchableWhenRecentDiscussionAreUnderMaxContactPerMonth(
    fromDate: Date,
  ): Promise<number>;

  //Offers
  getOffersAsAppellationAndRomeDtosBySiret(
    siret: string,
  ): Promise<AppellationAndRomeDto[]>;

  //SearchResult & SearchImmersionResults
  getSearchResultBySearchQuery(
    siret: SiretDto,
    appellationCode: AppellationCode,
    locationId: LocationId,
  ): Promise<RepositorySearchResultDto | undefined>;
  legacySearchImmersionResults(
    searchImmersionParams: LegacySearchImmersionParams,
  ): Promise<RepositorySearchImmertionResult[]>;
  getOffers(
    params: GetOffersParams,
  ): Promise<DataWithPagination<RepositorySearchImmertionResult>>;
  //Sirets
  getSiretsOfEstablishmentsWithRomeCode(rome: string): Promise<SiretDto[]>;
  getSiretOfEstablishmentsToSuggestUpdate(before: Date): Promise<SiretDto[]>;
  getSiretsOfEstablishmentsNotCheckedAtInseeSince(
    checkDate: Date,
    maxResults: number,
  ): Promise<SiretDto[]>;
  getSiretsInRepoFromSiretList(sirets: SiretDto[]): Promise<SiretDto[]>;
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
