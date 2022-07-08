import { ContactMethod } from "../../../../../../domain/immersionOffer/entities/ContactEntity";
import { LatLonDto } from "shared/src/latLon";
import { RomeCode } from "shared/src/rome";
import { SearchImmersionResultDto } from "shared/src/searchImmersion/SearchImmersionResult.dto";

import { SiretDto } from "shared/src/siret";

export type SearchContactDto = {
  id: string;
  lastName: string;
  firstName: string;
  email: string;
  job: string;
  phone: string;
};

export type SearchImmersionResultPublicV1 = {
  rome: RomeCode;
  romeLabel: string;
  appellationLabels: string[];
  naf: string;
  nafLabel: string;
  siret: SiretDto;
  name: string;
  voluntaryToImmersion: boolean;
  position: LatLonDto;
  address: string;
  city: string;
  contactMode?: ContactMethod;
  distance_m?: number;
  contactDetails?: SearchContactDto;
  numberOfEmployeeRange?: string;
  website?: string;
  additionalInformation?: string;
};

export const domainToSearchImmersionResultPublicV1 = (
  domain: SearchImmersionResultDto,
): SearchImmersionResultPublicV1 => domain;
