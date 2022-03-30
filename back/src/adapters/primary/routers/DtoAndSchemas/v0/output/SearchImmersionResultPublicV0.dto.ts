import { ImmersionContactInEstablishmentId } from "../../../../../../shared/formEstablishment/FormEstablishment.dto";
import { LatLonDto } from "../../../../../../shared/latLon";
import { RomeCode } from "../../../../../../shared/rome";
import { SearchImmersionResultDto } from "../../../../../../shared/searchImmersion/SearchImmersionResult.dto";

import { SiretDto } from "../../../../../../shared/siret";

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
  location: LatLonDto;
  address: string;
  city: string;
  contactMode?: "EMAIL" | "PHONE" | "IN_PERSON";
  distance_m?: number;
  contactDetails?: ContactDetailsPublicV0;
  numberOfEmployeeRange?: string;
};

export const domainToSearchImmersionResultPublicV0 = (
  domain: SearchImmersionResultDto,
): SearchImmersionResultPublicV0 => domain;
