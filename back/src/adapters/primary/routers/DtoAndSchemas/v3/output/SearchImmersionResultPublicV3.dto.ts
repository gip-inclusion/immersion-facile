import type {
  AddressDto,
  AppellationDto,
  BusinessName,
  BusinessNameCustomized,
  ContactMode,
  DateTimeIsoString,
  EstablishmentAdditionnalInformation,
  EstablishmentWebSite,
  FitForDisableWorkerOption,
  GeoPositionDto,
  InternalOfferDto,
  LocationId,
  NafCode,
  NafSousClasseLabel,
  NumberEmployeesRange,
  RemoteWorkMode,
  RomeCode,
  RomeLabel,
  SiretDto,
  UrlOfParner,
  WithIsAvailable,
} from "shared";

export type SearchImmersionResultPublicV3 = {
  rome: RomeCode;
  romeLabel: RomeLabel;
  appellations: AppellationDto[];
  establishmentScore: number;
  naf: NafCode;
  nafLabel: NafSousClasseLabel;
  siret: SiretDto;
  name: BusinessName;
  customizedName?: BusinessNameCustomized;
  voluntaryToImmersion: boolean;
  fitForDisabledWorkers: FitForDisableWorkerOption | null;
  locationId: LocationId | null;
  position: GeoPositionDto;
  address: AddressDto;
  contactMode?: ContactMode;
  distance_m?: number;
  numberOfEmployeeRange?: NumberEmployeesRange;
  website?: EstablishmentWebSite;
  additionalInformation?: EstablishmentAdditionnalInformation;
  urlOfPartner?: UrlOfParner;
  updatedAt?: DateTimeIsoString;
  createdAt?: DateTimeIsoString;
  remoteWorkMode: RemoteWorkMode;
} & WithIsAvailable;

export const domainToSearchImmersionResultPublicV3 = (
  searchImmersionResult: InternalOfferDto,
): SearchImmersionResultPublicV3 => searchImmersionResult;
