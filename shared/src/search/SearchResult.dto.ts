import type { AddressDto, LocationId } from "../address/address.dto";
import type {
  ContactMode,
  FitForDisableWorkerOption,
} from "../formEstablishment/FormEstablishment.dto";
import type { GeoPositionDto } from "../geoPosition/geoPosition.dto";
import type {
  AppellationDto,
  RomeCode,
} from "../romeAndAppellationDtos/romeAndAppellation.dto";
import type { SiretDto } from "../siret/siret";
import type { DateTimeIsoString } from "../utils/date";

export type SearchResultDto = {
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
