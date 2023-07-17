import {
  addressDtoToString,
  GeoPositionDto,
  RomeCode,
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
  numberOfEmployeeRange?: string;
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
    address: addressDtoToString(domain.address),
    city: domain.address.city,
  };
};
