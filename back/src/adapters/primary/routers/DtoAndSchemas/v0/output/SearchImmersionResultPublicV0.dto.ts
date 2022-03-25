import {
  ContactEntityV2,
  ContactMethod,
} from "../../../../../../domain/immersionOffer/entities/ContactEntity";
import { LatLonDto } from "../../../../../../shared/latLon";
import { RomeCode } from "../../../../../../shared/rome";
import { SearchImmersionResultDto } from "../../../../../../shared/searchImmersion/SearchImmersionResult.dto";

import { SiretDto } from "../../../../../../shared/siret";

export type SearchImmersionResultPublicV0 = {
  id: string;
  rome: RomeCode;
  romeLabel: string;
  naf: string;
  nafLabel: string;
  siret: SiretDto;
  name: string;
  voluntaryToImmersion: boolean;
  location: LatLonDto;
  address: string;
  city: string;
  contactMethod?: ContactMethod;
  distance_m?: number;
  businessContact?: ContactEntityV2;
  numberOfEmployeeRange?: string;
};

export const domainToSearchImmersionResultPublicV0 = (
  domain: SearchImmersionResultDto,
): SearchImmersionResultPublicV0 => domain;
