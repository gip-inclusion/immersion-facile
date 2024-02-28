import {
  AddressDto,
  AppellationDto,
  GeoPositionDto,
  LocationId,
  RomeCode,
  SearchResultDto,
  SiretDto,
} from "shared";
import { ContactMethod } from "../../../../../../domains/offer/entities/ContactEntity";

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
  locationId: LocationId | null;
};

export const domainToSearchImmersionResultPublicV2 = (
  searchImmersionResult: SearchResultDto,
): SearchImmersionResultPublicV2 => searchImmersionResult;
