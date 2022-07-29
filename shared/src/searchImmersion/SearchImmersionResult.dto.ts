import { AddressDto } from "../address/address.dto";
import { ContactMethod } from "../formEstablishment/FormEstablishment.dto";
import { LatLonDto } from "../latLon";
import { RomeCode } from "../romeAndAppellationDtos/romeAndAppellation.dto";
import { SiretDto } from "../siret";

export type SearchContactDto = {
  id: string;
  lastName: string;
  firstName: string;
  email: string;
  job: string;
  phone: string;
};

export type SearchImmersionResultDto = {
  rome: RomeCode;
  romeLabel: string;
  appellationLabels: string[];
  naf: string;
  nafLabel: string;
  siret: SiretDto;
  name: string;
  customizedName?: string;
  voluntaryToImmersion: boolean;
  position: LatLonDto;
  address: AddressDto;
  contactMode?: ContactMethod;
  distance_m?: number;
  contactDetails?: SearchContactDto;
  numberOfEmployeeRange?: string;
  website?: string;
  additionalInformation?: string;
};
