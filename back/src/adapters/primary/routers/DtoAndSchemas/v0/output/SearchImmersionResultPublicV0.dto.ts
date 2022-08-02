import { addressDtoToString } from "shared/src/utils/address";
import { ImmersionContactInEstablishmentId } from "shared/src/formEstablishment/FormEstablishment.dto";
import { GeoPositionDto } from "shared/src/geoPosition/geoPosition.dto";
import { RomeCode } from "shared/src/rome";
import {
  SearchContactDto,
  SearchImmersionResultDto,
} from "shared/src/searchImmersion/SearchImmersionResult.dto";

import { SiretDto } from "shared/src/siret";

export type ContactDetailsPublicV0 = {
  id: ImmersionContactInEstablishmentId;
  lastName: string;
  firstName: string;
  email: string;
  role: string;
  phone: string;
};

export type SearchImmersionResultPublicV0 = {
  id: string;
  rome: RomeCode;
  romeLabel: string;
  naf: string;
  nafLabel: string;
  siret: SiretDto;
  name: string;
  voluntaryToImmersion: boolean;
  location: GeoPositionDto;
  address: string;
  city: string;
  contactMode?: "EMAIL" | "PHONE" | "IN_PERSON";
  distance_m?: number;
  contactDetails?: ContactDetailsPublicV0;
  numberOfEmployeeRange?: string;
};

const domainToContactDetailsV0 = (
  contactDetails: SearchContactDto,
): ContactDetailsPublicV0 => {
  const { job, ...rest } = contactDetails;
  return { ...rest, role: job };
};

export const domainToSearchImmersionResultPublicV0 = (
  domain: SearchImmersionResultDto,
): SearchImmersionResultPublicV0 => {
  const {
    appellationLabels,
    position,
    website,
    additionalInformation,
    ...rest
  } = domain;
  return {
    ...rest,
    id: `${rest.siret}-${rest.rome}`,
    location: position,
    contactDetails: domain.contactDetails
      ? domainToContactDetailsV0(domain.contactDetails)
      : undefined,
    address: addressDtoToString(domain.address),
    city: domain.address.city,
  };
};
