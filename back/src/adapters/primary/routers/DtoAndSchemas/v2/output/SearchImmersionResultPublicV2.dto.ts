import {
  AddressDto,
  AppellationDto,
  GeoPositionDto,
  RomeCode,
  SearchResultDto,
  SiretDto,
} from "shared";
import { ContactMethod } from "../../../../../../domain/immersionOffer/entities/ContactEntity";

export type SearchImmersionResultPublicV2 = {
  rome: RomeCode;
  romeLabel: string;
  appellations: AppellationDto[];
  naf: string;
  nafLabel: string;
  siret: SiretDto;
  name: string;
  voluntaryToImmersion: boolean;
  position: GeoPositionDto;
  address: AddressDto;
  contactMode?: ContactMethod;
  distance_m?: number;
  numberOfEmployeeRange?: string;
  website?: string;
  additionalInformation?: string;
};

export const domainToSearchImmersionResultPublicV2 = (
  searchImmersionResult: SearchResultDto,
): SearchImmersionResultPublicV2 => searchImmersionResult;
