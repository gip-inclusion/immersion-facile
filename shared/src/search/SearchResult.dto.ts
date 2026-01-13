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
} from "../romeAndAppellationDtos/romeAndAppellation.dto";
import type { SiretDto } from "../siret/siret";
import type { DateTimeIsoString } from "../utils/date";

type CommonSearchResultDto = {
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
  fitForDisabledWorkers: FitForDisableWorkerOption | null;
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

export type SearchResultDto = CommonSearchResultDto & {
  remoteWorkMode: RemoteWorkMode;
};

export type ExternalSearchResultDto = CommonSearchResultDto;

export type GetOffersPerPageOption = (typeof getOffersPerPageOptions)[number];
export const getOffersPerPageOptions = [6, 12, 24, 48] as const;

export const isSearchResultDto = (
  result: SearchResultDto | ExternalSearchResultDto,
): result is SearchResultDto => "remoteWorkMode" in result;
