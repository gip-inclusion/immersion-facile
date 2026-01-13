import type {
  AddressDto,
  AppellationDto,
  ContactMode,
  ExternalSearchResultDto,
  GeoPositionDto,
  LocationId,
  RomeCode,
  SearchResultDto,
  SiretDto,
} from "shared";

export type SearchImmersionResultPublicV2 = {
  rome: RomeCode;
  romeLabel: string;
  appellations: AppellationDto[];
  establishmentScore: number;
  naf: string;
  nafLabel: string;
  siret: SiretDto;
  name: string;
  voluntaryToImmersion: boolean;
  position: GeoPositionDto;
  address: AddressDto;
  contactMode?: ContactMode;
  distance_m?: number;
  numberOfEmployeeRange?: string;
  website?: string;
  additionalInformation?: string;
  locationId: LocationId | null;
};

export const domainToSearchImmersionResultPublicV2 = (
  searchImmersionResult: SearchResultDto | ExternalSearchResultDto,
): SearchImmersionResultPublicV2 => {
  const {
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    fitForDisabledWorkers: _fitForDisabledWorkers,
    customizedName: _customizedName,
    remoteWorkMode: _remoteWorkMode,
    ...searchImmersionResultPublicV2Data
  } = searchImmersionResult as SearchResultDto;
  return searchImmersionResultPublicV2Data;
};
