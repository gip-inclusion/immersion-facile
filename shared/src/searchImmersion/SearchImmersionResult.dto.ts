import { AddressDto } from "../address/address.dto";
import { ContactMethod } from "../formEstablishment/FormEstablishment.dto";
import { GeoPositionDto } from "../geoPosition/geoPosition.dto";
import {
  AppellationCode,
  AppellationDto,
  RomeCode,
} from "../romeAndAppellationDtos/romeAndAppellation.dto";
import { SiretDto } from "../siret/siret";

export type SearchImmersionResultDto = {
  rome: RomeCode;
  romeLabel: string;
  appellations: AppellationDto[];
  naf: string;
  nafLabel: string;
  siret: SiretDto;
  name: string;
  customizedName?: string;
  voluntaryToImmersion: boolean;
  fitForDisabledWorkers?: boolean;
  position: GeoPositionDto;
  address: AddressDto;
  contactMode?: ContactMethod;
  distance_m?: number;
  numberOfEmployeeRange?: string;
  website?: string;
  additionalInformation?: string;
  urlOfPartner?: string;
};

export type WithSiretAndAppellation = {
  siret: SiretDto;
  appellationCode: AppellationCode;
};
