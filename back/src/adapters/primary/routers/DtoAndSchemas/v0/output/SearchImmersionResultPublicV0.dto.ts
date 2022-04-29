import { ImmersionContactInEstablishmentId } from "shared/src/formEstablishment/FormEstablishment.dto";
import { LatLonDto } from "shared/src/latLon";
import { RomeCode } from "shared/src/rome";
import { SearchImmersionResultDto } from "shared/src/searchImmersion/SearchImmersionResult.dto";

import { SiretDto } from "shared/src/siret";

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
): SearchImmersionResultPublicV0 => {
  const { appellationLabels, ...domainWithoutAppellationLabels } = domain;
  return {
    ...domainWithoutAppellationLabels,
    id: `${domainWithoutAppellationLabels.siret}-${domainWithoutAppellationLabels.rome}`,
  };
};
