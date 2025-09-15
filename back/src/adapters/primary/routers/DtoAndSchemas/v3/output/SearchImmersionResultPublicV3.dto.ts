import type {
  AddressDto,
  AppellationDto,
  ContactMode,
  DateTimeIsoString,
  GeoPositionDto,
  LocationId,
  RomeCode,
  SearchResultDto,
  SiretDto,
} from "shared";

export type SearchImmersionResultPublicV3 = {
  rome: RomeCode;
  romeLabel: string;
  appellations: AppellationDto[];
  establishmentScore: number;
  naf: string;
  nafLabel: string;
  siret: SiretDto;
  name: string;
  customizedName?: string;
  voluntaryToImmersion: boolean;
  fitForDisabledWorkers?: boolean;
  locationId: LocationId | null;
  position: GeoPositionDto;
  address: AddressDto;
  contactMode?: ContactMode;
  distance_m?: number;
  numberOfEmployeeRange?: string;
  website?: string;
  additionalInformation?: string;
  urlOfPartner?: string;
  updatedAt?: DateTimeIsoString;
  createdAt?: DateTimeIsoString;
};

export const domainToSearchImmersionResultPublicV3 = (
  searchImmersionResult: SearchResultDto,
): SearchImmersionResultPublicV3 => searchImmersionResult;
