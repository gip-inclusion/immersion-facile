import {
  addressDtoToString,
  GeoPositionDto,
  RomeCode,
  SearchResultDto,
  SiretDto,
} from "shared";
import { GetSearchResultBySiretAndRomePayload } from "../../../../../../domain/immersionOffer/useCases/GetSearchResultById";

export type LegacyImmersionOfferId = `${SiretDto}-${RomeCode}`;

export const toLegacyImmersionOfferId = (
  siret: SiretDto,
  rome: RomeCode,
): LegacyImmersionOfferId => `${siret}-${rome}`;

export const toGetSearchImmersionResultBySiretAndRomePayload = (
  id: LegacyImmersionOfferId,
): GetSearchResultBySiretAndRomePayload => {
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
  domain: SearchResultDto,
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
