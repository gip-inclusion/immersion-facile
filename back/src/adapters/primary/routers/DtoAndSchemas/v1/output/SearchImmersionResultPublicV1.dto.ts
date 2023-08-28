import {
  addressDtoToString,
  GeoPositionDto,
  RomeCode,
  SearchResultDto,
  SiretDto,
} from "shared";
import { ContactMethod } from "../../../../../../domain/immersionOffer/entities/ContactEntity";

export type SearchImmersionResultPublicV1 = {
  rome: RomeCode;
  romeLabel: string;
  appellationLabels: string[];
  naf: string;
  nafLabel: string;
  siret: SiretDto;
  name: string;
  voluntaryToImmersion: boolean;
  position: GeoPositionDto;
  address: string;
  city: string;
  contactMode?: ContactMethod;
  distance_m?: number;
  numberOfEmployeeRange?: string;
  website?: string;
  additionalInformation?: string;
};

export const domainToSearchImmersionResultPublicV1 = ({
  appellations,
  ...domain
}: SearchResultDto): SearchImmersionResultPublicV1 => ({
  ...domain,
  appellationLabels: appellations.map(
    (appellation) => appellation.appellationLabel,
  ),
  address: addressDtoToString(domain.address),
  city: domain.address.city,
});
