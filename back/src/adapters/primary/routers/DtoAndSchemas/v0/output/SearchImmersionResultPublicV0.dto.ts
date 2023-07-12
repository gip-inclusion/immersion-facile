import {
  addressDtoToString,
  GeoPositionDto,
  ImmersionContactInEstablishmentId,
  RomeCode,
  SearchContactDto,
  SearchImmersionResultDto,
  SiretDto,
} from "shared";
import { GetSearchImmersionResultBySiretAndRomePayload } from "../../../../../../domain/immersionOffer/useCases/GetImmersionOfferById";

export type LegacyImmersionOfferId = `${SiretDto}-${RomeCode}`;

export const toLegacyImmersionOfferId = (
  siret: SiretDto,
  rome: RomeCode,
): LegacyImmersionOfferId => `${siret}-${rome}`;

export const toGetSearchImmersionResultBySiretAndRomePayload = (
  id: LegacyImmersionOfferId,
): GetSearchImmersionResultBySiretAndRomePayload => {
  const [siret, rome] = id.split("-");
  return {
    rome,
    siret,
  };
};

type ContactDetailsPublicV0 = {
  id: ImmersionContactInEstablishmentId;
  lastName: string;
  firstName: string;
  email: string;
  role: string;
  phone: string;
};

export type SearchImmersionResultPublicV0 = {
  id: LegacyImmersionOfferId;
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
  const { appellations, position, website, additionalInformation, ...rest } =
    domain;
  return {
    ...rest,
    id: toLegacyImmersionOfferId(rest.siret, rest.rome),
    location: position,
    contactDetails: domain.contactDetails
      ? domainToContactDetailsV0(domain.contactDetails)
      : undefined,
    address: addressDtoToString(domain.address),
    city: domain.address.city,
  };
};
