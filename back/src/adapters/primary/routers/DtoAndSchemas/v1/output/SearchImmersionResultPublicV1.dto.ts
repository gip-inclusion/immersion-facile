import { ContactMethod } from "../../../../../../domain/immersionOffer/entities/ContactEntity";
import { LatLonDto } from "../../../../../../shared/latLon";
import { RomeCode } from "../../../../../../shared/rome";
import { SearchImmersionResultDto } from "../../../../../../shared/searchImmersion/SearchImmersionResult.dto";

import { SiretDto } from "../../../../../../shared/siret";

export type SearchContactDto = {
  id: string;
  lastName: string;
  firstName: string;
  email: string;
  role: string;
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
  location: LatLonDto;
  address: string;
  city: string;
  contactMode?: ContactMethod;
  distance_m?: number;
  contactDetails?: SearchContactDto;
  numberOfEmployeeRange?: string;
};

export const domainToSearchImmersionResultPublicV1 = (
  domain: SearchImmersionResultDto,
): SearchImmersionResultPublicV1 => domain;
