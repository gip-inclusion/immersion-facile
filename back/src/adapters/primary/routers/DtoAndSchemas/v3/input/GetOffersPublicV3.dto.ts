import type {
  AppellationCode,
  DepartmentCode,
  EstablishmentSearchableByValue,
  FitForDisableWorkerOption,
  LocationId,
  NafCode,
  PaginationQueryParams,
  SiretDto,
  SortDirection,
  WithAcquisition,
  WithOptionalRemoteWorkModes,
} from "shared";

type GetOffersFlatParamsPublicV3Common = WithAcquisition & {
  place?: string;
  fitForDisabledWorkers?: FitForDisableWorkerOption[];
  locationIds?: LocationId[];
  nafCodes?: NafCode[];
  searchableBy?: EstablishmentSearchableByValue;
  sirets?: SiretDto[];
  departmentCodes?: DepartmentCode[];
  showOnlyAvailableOffers?: boolean;
  appellationCodes?: AppellationCode[];
} & WithOptionalRemoteWorkModes;

type GetOffersFlatParamsPublicV3WithDistance = {
  sortBy: "distance";
  sortOrder: SortDirection;
  latitude: number;
  longitude: number;
  distanceKm: number;
};

type GetOffersFlatParamsPublicV3WithDateOrScore = {
  sortBy: "date" | "score";
  sortOrder: SortDirection;
  latitude?: number;
  longitude?: number;
  distanceKm?: number;
};

export type GetOffersFlatParamsPublicV3 = PaginationQueryParams &
  GetOffersFlatParamsPublicV3Common &
  (
    | GetOffersFlatParamsPublicV3WithDistance
    | GetOffersFlatParamsPublicV3WithDateOrScore
  );
