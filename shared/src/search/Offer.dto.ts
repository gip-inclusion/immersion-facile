import type { AddressDto, LocationId } from "../address/address.dto";
import type {
  ContactMode,
  FitForDisableWorkerOption,
  RemoteWorkMode,
} from "../formEstablishment/FormEstablishment.dto";
import type { GeoPositionDto } from "../geoPosition/geoPosition.dto";
import type {
  AppellationDto,
  RomeCode,
  RomeLabel,
} from "../romeAndAppellationDtos/romeAndAppellation.dto";
import type { SiretDto } from "../siret/siret";
import type { Flavor } from "../typeFlavors";
import type { DateTimeIsoString } from "../utils/date";

export type UrlOfParner = Flavor<string, "UrlOfParner">;

type CommonOfferDto = {
  rome: RomeCode;
  romeLabel: RomeLabel;
  appellations: AppellationDto[];
  establishmentScore: number;
  naf: string;
  nafLabel: string;
  siret: SiretDto;
  name: string;
  customizedName?: string;
  voluntaryToImmersion: boolean;
  fitForDisabledWorkers: FitForDisableWorkerOption | null;
  locationId: LocationId | null;
  position: GeoPositionDto;
  address: AddressDto;
  contactMode?: ContactMode;
  distance_m?: number;
  numberOfEmployeeRange?: string;
  website?: string;
  additionalInformation?: string;
  urlOfPartner?: UrlOfParner;
  updatedAt?: DateTimeIsoString;
  createdAt?: DateTimeIsoString;
};

export type WithIsAvailable = {
  isAvailable: boolean;
};

export type ExternalOfferDto = CommonOfferDto;

export type InternalOfferDto = CommonOfferDto &
  WithIsAvailable & {
    remoteWorkMode: RemoteWorkMode;
  };

export type OfferDto = InternalOfferDto | ExternalOfferDto;

export type GetOffersPerPageOption = (typeof getOffersPerPageOptions)[number];
export const getOffersPerPageOptions = [6, 12, 24, 48] as const;

export const isInternalOfferDto = (
  result: OfferDto,
): result is InternalOfferDto => "remoteWorkMode" in result;
